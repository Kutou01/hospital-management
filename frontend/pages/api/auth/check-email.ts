import { supabase } from "@/lib/supabase";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        isAvailable: false,
        message: "Email là bắt buộc",
      });
    }

    // Trim and normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check email length
    if (normalizedEmail.length > 254) {
      return res.status(400).json({
        success: false,
        isAvailable: false,
        message: "Email quá dài (tối đa 254 ký tự)",
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        isAvailable: false,
        message: "Email không hợp lệ. Vui lòng kiểm tra lại định dạng email.",
      });
    }

    // Check if email exists in profiles table
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profileError) {
      console.error("Error checking email in profiles:", profileError);
      return res.status(500).json({
        success: false,
        isAvailable: false,
        message: "Không thể kiểm tra email. Vui lòng thử lại.",
      });
    }

    if (existingProfile) {
      return res.status(200).json({
        success: true,
        isAvailable: false,
        message:
          "Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.",
        suggestion: "login",
      });
    }

    return res.status(200).json({
      success: true,
      isAvailable: true,
      message: "Email có thể sử dụng.",
    });
  } catch (error) {
    console.error("Error in check-email API:", error);
    return res.status(500).json({
      success: false,
      isAvailable: false,
      message: "Không thể kiểm tra email. Vui lòng thử lại.",
    });
  }
}
