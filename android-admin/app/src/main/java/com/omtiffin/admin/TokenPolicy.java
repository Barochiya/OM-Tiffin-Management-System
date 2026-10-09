package com.omtiffin.admin;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.json.JSONObject;

/** Local expiry check only. The server remains the authority for JWT signature/account validity. */
public final class TokenPolicy {
    public static boolean usable(String token, long nowSeconds) {
        try {
            if (token == null || token.length() > 16384) return false;
            String[] parts = token.split("\\.", -1);
            if (parts.length != 3 || parts[0].isEmpty() || parts[2].isEmpty()) return false;
            JSONObject claims = new JSONObject(new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8));
            Object expiry = claims.opt("exp");
            return expiry instanceof Number && ((Number)expiry).longValue() > nowSeconds + 30;
        } catch (Exception ignored) { return false; }
    }
    private TokenPolicy() {}
}
