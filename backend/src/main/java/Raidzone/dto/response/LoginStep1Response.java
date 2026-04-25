package Raidzone.dto.response;

public record LoginStep1Response(
        String message,
        String maskedEmail
) {
    public static LoginStep1Response of(String email) {
        return new LoginStep1Response(
                "Verification code sent to your email",
                maskEmail(email)
        );
    }

    private static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@");
        String local  = parts[0];
        String domain = parts[1];
        if (local.length() <= 2) return local.charAt(0) + "***@" + domain;
        return local.charAt(0) + "***@" + domain;
    }
}
