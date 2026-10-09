package com.omtiffin.admin;
import org.junit.Test;
import static org.junit.Assert.*;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
public class TokenPolicyTest {
    private String token(String claims) { return "eyJhbGciOiJIUzI1NiJ9."+Base64.getUrlEncoder().withoutPadding().encodeToString(claims.getBytes(StandardCharsets.UTF_8))+".signature"; }
    @Test public void expiredAndNearlyExpiredSessionsRequirePasswordLogin() {
        assertFalse(TokenPolicy.usable(token("{\"exp\":1000}"), 1000));
        assertFalse(TokenPolicy.usable(token("{\"exp\":1029}"), 1000));
        assertTrue(TokenPolicy.usable(token("{\"exp\":1031}"), 1000));
    }
    @Test public void missingOrMalformedExpiryCannotEnableQuickUnlock() {
        for(String value:new String[]{null,"","malformed","a.not-base64.c",token("{}"),token("{\"exp\":\"9999\"}"),token("{\"exp\":null}"),token("{\"exp\":-1}")}) assertFalse(TokenPolicy.usable(value,1000));
    }
    @Test public void expiryNeverReplacesServerVerification() {
        assertTrue(TokenPolicy.usable(token("{\"exp\":9999,\"id\":\"demo\"}"),1000));
        assertFalse(TokenPolicy.usable("."+token("{\"exp\":9999}"),1000));
    }
}
