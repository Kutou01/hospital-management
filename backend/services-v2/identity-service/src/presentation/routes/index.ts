/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Express, Router } from "express";
import { body, validationResult } from "express-validator";
import { DIContainer } from "../../../shared/infrastructure/di/container";

export function setupRoutes(app: Express, container: DIContainer): void {
  const apiRouter = Router();

  // Validation middleware
  const handleValidationErrors = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: errors.array().map((error: any) => ({
          field: error.param,
          message: error.msg,
          value: error.value,
        })),
      });
    }
    next();
  };

  // Authentication validation rules
  const loginValidation = [
    body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Mật khẩu phải có ít nhất 8 ký tự"),
  ];

  const registerValidation = [
    body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),
    body("password")
      .isLength({ min: 8 })
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
      ),
    body("fullName")
      .isLength({ min: 2, max: 100 })
      .withMessage("Họ tên phải từ 2-100 ký tự"),
    body("phoneNumber")
      .optional()
      .matches(/^0\d{9}$/)
      .withMessage("Số điện thoại phải có 10 chữ số bắt đầu bằng 0"),
    body("role")
      .optional()
      .isIn(["admin", "doctor", "patient", "receptionist"])
      .withMessage("Vai trò không hợp lệ"),
  ];

  // =====================================================
  // AUTHENTICATION ENDPOINTS
  // =====================================================

  // POST /api/v1/auth/login - User login
  apiRouter.post(
    "/auth/login",
    loginValidation,
    handleValidationErrors,
    async (req, res) => {
      try {
        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";

        // TODO: Implement authentication use case
        // const result = await authenticateUserUseCase.execute({
        //   email,
        //   password,
        //   ipAddress,
        //   userAgent
        // });

        // Temporary mock response
        res.json({
          success: true,
          message: "Đăng nhập thành công",
          data: {
            user: {
              id: "temp-user-id",
              email,
              role: "patient",
              fullName: "Test User",
            },
            token: "temp-jwt-token",
            refreshToken: "temp-refresh-token",
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Lỗi hệ thống",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // POST /api/v1/auth/register - User registration
  apiRouter.post(
    "/auth/register",
    registerValidation,
    handleValidationErrors,
    async (req, res) => {
      try {
        const {
          email,
          password,
          fullName,
          phoneNumber,
          role = "patient",
        } = req.body;
        const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";

        // TODO: Implement registration use case
        // const result = await registerUserUseCase.execute({
        //   email,
        //   password,
        //   profile: { fullName, phoneNumber },
        //   role,
        //   metadata: { ipAddress, userAgent }
        // });

        // Temporary mock response
        res.status(201).json({
          success: true,
          message: "Đăng ký thành công",
          data: {
            user: {
              id: "temp-user-id",
              email,
              role,
              fullName,
              phoneNumber,
            },
            requiresEmailVerification: true,
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Lỗi hệ thống",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // POST /api/v1/auth/logout - User logout
  apiRouter.post("/auth/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7); // Remove 'Bearer '

      // TODO: Implement logout use case
      // const result = await logoutUserUseCase.execute({ token });

      res.json({
        success: true,
        message: "Đăng xuất thành công",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET /api/v1/auth/me - Get current user profile
  apiRouter.get("/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7); // Remove 'Bearer '

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Token xác thực không được cung cấp",
        });
      }

      // TODO: Implement get current user use case
      // const result = await getCurrentUserUseCase.execute({ token });

      // Temporary mock response
      res.json({
        success: true,
        data: {
          user: {
            id: "temp-user-id",
            email: "user@example.com",
            role: "patient",
            fullName: "Test User",
            phoneNumber: "0123456789",
            isEmailVerified: true,
            createdAt: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /api/v1/auth/refresh - Refresh access token
  apiRouter.post("/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token không được cung cấp",
        });
      }

      // TODO: Implement refresh token use case
      // const result = await refreshTokenUseCase.execute({ refreshToken });

      // Temporary mock response
      res.json({
        success: true,
        message: "Token đã được làm mới",
        data: {
          token: "new-jwt-token",
          refreshToken: "new-refresh-token",
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Sample endpoint for testing
  apiRouter.get("/sample", (req, res) => {
    res.json({
      message: "Identity & Access Service API",
      features: [
        "Authentication",
        "Authorization",
        "Session Management",
        "Role Management",
      ],
      patterns: ["Strategy", "Decorator", "Repository"],
      endpoints: {
        "POST /api/v1/auth/login": "User login",
        "POST /api/v1/auth/register": "User registration",
        "POST /api/v1/auth/logout": "User logout",
        "GET /api/v1/auth/me": "Get current user",
        "POST /api/v1/auth/refresh": "Refresh token",
      },
    });
  });

  // Mount API routes
  app.use("/api/v1", apiRouter);
}
