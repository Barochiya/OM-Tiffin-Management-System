package com.omtiffin.admin;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Only an authenticated Android Keystore key may encrypt/decrypt a remembered admin token. */
public final class SecureSession {
    private static final String ALIAS = "om.admin.session.v1";
    private static final byte[] AAD = "com.omtiffin.admin:session:v1".getBytes(StandardCharsets.UTF_8);
    private final SharedPreferences preferences;
    public SecureSession(Context context) {
        preferences = context.getSharedPreferences("device_unlock", Context.MODE_PRIVATE);
    }
    public boolean enabled() { return preferences.contains("ciphertext") && preferences.contains("iv"); }
    private KeyStore store() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null); return store;
    }
    private SecretKey key() throws Exception {
        KeyStore store = store();
        if (store.containsAlias(ALIAS)) return (SecretKey)store.getKey(ALIAS, null);
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true).setUserAuthenticationRequired(true);
        if (Build.VERSION.SDK_INT >= 30) builder.setUserAuthenticationParameters(30, KeyProperties.AUTH_BIOMETRIC_STRONG | KeyProperties.AUTH_DEVICE_CREDENTIAL);
        else builder.setUserAuthenticationValidityDurationSeconds(30);
        generator.init(builder.build()); return generator.generateKey();
    }
    public void save(String token) throws Exception {
        if (!TokenPolicy.usable(token, System.currentTimeMillis()/1000)) throw new IllegalArgumentException("Expired session");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, key()); cipher.updateAAD(AAD);
        byte[] encrypted = cipher.doFinal(token.getBytes(StandardCharsets.UTF_8));
        if (!preferences.edit().putString("ciphertext", Base64.encodeToString(encrypted, Base64.NO_WRAP))
            .putString("iv", Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP)).commit()) throw new IllegalStateException("Could not save session");
    }
    public String read() throws Exception {
        if (!enabled()) throw new IllegalStateException("No remembered session");
        // Never generate a replacement key when reading an existing encrypted session.
        SecretKey key = (SecretKey)store().getKey(ALIAS, null);
        if (key == null) throw new IllegalStateException("Screen lock key changed");
        byte[] iv = Base64.decode(preferences.getString("iv", ""), Base64.NO_WRAP);
        byte[] bytes = Base64.decode(preferences.getString("ciphertext", ""), Base64.NO_WRAP);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv)); cipher.updateAAD(AAD);
        String token = new String(cipher.doFinal(bytes), StandardCharsets.UTF_8);
        if (!TokenPolicy.usable(token, System.currentTimeMillis()/1000)) throw new IllegalArgumentException("Session expired");
        return token;
    }
    public void clear() {
        preferences.edit().clear().commit();
        try { store().deleteEntry(ALIAS); } catch (Exception ignored) {}
    }
}
