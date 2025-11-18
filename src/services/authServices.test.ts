import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  initiatePasswordReset,
  logoutUser,
  refresh,
  resetPassword,
} from "./authServices";
import crypto from "crypto";

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("crypto");
type MockPrisma = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  refreshToken: {
    findUnique: jest.Mock;
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
  passwordResetToken: {
    create: jest.Mock;
    findUnique: jest.Mock;
    deleteMany: jest.Mock;
  };
  blacklistedToken: {
    create: jest.Mock;
  };
};

const mockedCrypto = crypto as jest.Mocked<typeof crypto>;

function getMockPrisma(): MockPrisma {
  const globalRef = global as typeof global & { __mockPrisma?: MockPrisma };
  if (!globalRef.__mockPrisma) {
    globalRef.__mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        deleteMany: jest.fn(),
      },
      blacklistedToken: {
        create: jest.fn(),
      },
    };
  }
  return globalRef.__mockPrisma;
}

jest.mock("../../generate/prisma", () => ({
  PrismaClient: jest.fn().mockImplementation(() => getMockPrisma()),
}));

const { loginUser, registerUser } = require("./authServices") as {
  loginUser: typeof import("./authServices").loginUser;
  registerUser: typeof import("./authServices").registerUser;
};

const mockPrisma = getMockPrisma();
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe("registerUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.create.mockReset();
  });

  it("should successfully register a new user", async () => {
    const mockUser = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      password: "hashedPassword123!",
      createdAt: new Date(),
      updatedAt: new Date(),
      tokenVersion: 1,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      twoFactorSetupAt: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue("hashedPassword123!" as never);
    mockPrisma.user.create.mockResolvedValue(mockUser);

    const result = await registerUser(
      "Test User",
      "test@example.com",
      "Password123!",
    );

    // Use the typed mock functions in assertions too
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });

    expect(mockedBcrypt.hash).toHaveBeenCalledWith("Password123!", 12);

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword123!",
      },
    });

    expect(result).toEqual(mockUser);
  });
});

describe("loginUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.refreshToken.create.mockReset();
    process.env.JWT_SECRET = "test-secret";
  });

  it("should successfully login a user", async () => {
    const mockUserDB = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      password: "hashedPassword123!",
      tokenVersion: 1,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      twoFactorSetupAt: null,
    };
    //configuring mocks
    mockPrisma.user.findUnique.mockResolvedValue(mockUserDB);
    mockedBcrypt.compare.mockResolvedValue(true as never);
    mockedJwt.sign.mockReturnValue("mockToken" as any);
    mockPrisma.refreshToken.create.mockResolvedValue({
      id: 1,
      token: "refresh",
    } as never);

    (crypto.randomBytes as jest.Mock).mockReturnValue({
      toString: jest.fn().mockReturnValue("mock_refresh_token"),
    });

    const result = await loginUser("test@example.com", "Password123!");

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });

    expect(result.token).toEqual("mockToken");
  });
});

describe("refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  it("should generate new access token with valid refresh token", async () => {
    //configuring mocks
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      userId: 1,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    mockPrisma.user.findUnique.mockResolvedValue({ tokenVersion: 1 });
    mockedJwt.sign.mockReturnValue("new_access_token_123" as any);

    const result = await refresh("valid_refresh_token");

    expect(result.accessToken).toEqual("new_access_token_123");
    expect(result.refreshToken).toEqual("valid_refresh_token");
  });
});

describe("inititatePasswordReset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.refreshToken.create.mockReset();
    process.env.JWT_SECRET = "test-secret";

    (crypto.randomBytes as jest.Mock).mockReset();
    (crypto.randomBytes as jest.Mock).mockReturnValue({
      toString: jest.fn().mockReturnValue("mock_refresh_token"),
    });
  });

  it("should initiate password reset for existing user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "test@example.com",
      name: "Test User",
      password: "hashed",
      tokenVersion: 1,
      isTwoFactorEnabled: true,
    });

    mockedCrypto.randomBytes.mockReturnValue({
      toString: jest.fn().mockReturnValue("mock_reset_token_123"),
    } as any);

    mockPrisma.passwordResetToken.create.mockResolvedValue({
      id: 1,
      token: "mock_reset_token_123",
      userId: 1,
      expiresAt: new Date(),
    });

    const result = await initiatePasswordReset("test@example.com");

    expect(result).toEqual("mock_reset_token_123");
  });
});

describe("resetPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reset password with valid token", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
      userId: 1,
      expiresAt: new Date(Date.now() + 3600000),
    });
    mockedBcrypt.hash.mockResolvedValue("new_hashed_password" as never);
    mockPrisma.user.update.mockResolvedValue({} as any);
    mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({} as any);
    // Add your assertions here

    const result = await resetPassword("valid_reset_token", "NewPassword123!");

    expect(result).toBe(true);
    expect(mockedBcrypt.hash).toHaveBeenCalledWith("NewPassword123!", 12);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { password: "new_hashed_password" },
    });
    expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 1 },
    });
  });

  it("should throw error for invalid or expired token", async () => {
    // Add your test implementation here
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
      userId: 1,
      expiresAt: new Date(Date.now() - 3600000),
    });

    await expect(
      resetPassword("expired_token", "NewPassword123!"),
    ).rejects.toThrow("Invalid or expired password reset token");
  });

  it("should throw error when token not found", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

    await expect(
      resetPassword("nonexistent_token", "NewPassword123!"),
    ).rejects.toThrow("Invalid or expired password reset token");
  });
});

describe("logoutUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should logout user by invalidating refresh tokens", async () => {
    mockedJwt.decode.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    mockPrisma.blacklistedToken.create.mockResolvedValue({} as any);
    mockPrisma.refreshToken.deleteMany.mockResolvedValue({} as any);

    const result = await logoutUser(
      "1",
      "refresh_token_123",
      "header.payload.signature",
    );

    expect(result).toEqual({ success: true });
    expect(mockPrisma.blacklistedToken.create).toHaveBeenCalled();
    expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalled();
  });

  it("should throw error for invalid access token format", async () => {});

  it("should throw error for invalid JWT token", async () => {});
});
