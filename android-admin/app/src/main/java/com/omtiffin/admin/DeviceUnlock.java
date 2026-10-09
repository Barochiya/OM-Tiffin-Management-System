package com.omtiffin.admin;

import android.app.KeyguardManager;
import android.content.Intent;
import android.os.Build;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

/** Android owns all fingerprint/PIN UI; the app never receives the phone PIN or biometric data. */
public final class DeviceUnlock {
    public static final int CREDENTIAL_REQUEST = 44;
    private final FragmentActivity activity;
    private Runnable success, cancelled;
    private BiometricPrompt prompt;
    private boolean busy, usingCredential;
    private int generation;
    public DeviceUnlock(FragmentActivity activity) { this.activity = activity; }
    public boolean available() { return ((KeyguardManager)activity.getSystemService(android.content.Context.KEYGUARD_SERVICE)).isDeviceSecure(); }
    public boolean busy() { return busy; }
    public void authenticate(Runnable success, Runnable cancelled) {
        if (busy) return;
        this.success = success; this.cancelled = cancelled;
        if (!available()) { finish(false); return; }
        busy = true;usingCredential=false;final int attempt=++generation;
        int authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG;
        if (Build.VERSION.SDK_INT >= 30) authenticators |= BiometricManager.Authenticators.DEVICE_CREDENTIAL;
        if (BiometricManager.from(activity).canAuthenticate(authenticators) != BiometricManager.BIOMETRIC_SUCCESS) { credential(); return; }
        BiometricPrompt.PromptInfo.Builder builder = new BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock OM Tiffin").setSubtitle("Confirm with your phone's fingerprint or screen lock")
            .setAllowedAuthenticators(authenticators).setConfirmationRequired(true);
        if (Build.VERSION.SDK_INT < 30) builder.setNegativeButtonText("Use phone PIN");
        prompt = new BiometricPrompt(activity, ContextCompat.getMainExecutor(activity), new BiometricPrompt.AuthenticationCallback() {
            @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) { if(busy && attempt==generation && !usingCredential)finish(true); }
            @Override public void onAuthenticationError(int code, CharSequence message) {
                if (!busy || usingCredential || attempt!=generation) return;
                if (code == BiometricPrompt.ERROR_NEGATIVE_BUTTON || code == BiometricPrompt.ERROR_LOCKOUT || code == BiometricPrompt.ERROR_LOCKOUT_PERMANENT
                    || code == BiometricPrompt.ERROR_NO_BIOMETRICS || code == BiometricPrompt.ERROR_HW_NOT_PRESENT || code == BiometricPrompt.ERROR_HW_UNAVAILABLE) credential();
                else finish(false);
            }
        });
        prompt.authenticate(builder.build());
    }
    private void credential() {
        usingCredential=true;
        KeyguardManager keyguard = (KeyguardManager)activity.getSystemService(android.content.Context.KEYGUARD_SERVICE);
        Intent intent = keyguard.createConfirmDeviceCredentialIntent("Unlock OM Tiffin", "Use your phone PIN, pattern or password");
        if (intent == null) { finish(false); return; }
        try { activity.startActivityForResult(intent, CREDENTIAL_REQUEST); } catch (Exception ignored) { finish(false); }
    }
    public boolean result(int request, int result) {
        if (request != CREDENTIAL_REQUEST) return false;
        finish(result == android.app.Activity.RESULT_OK); return true;
    }
    private void finish(boolean approved) {
        Runnable callback = approved ? success : cancelled;
        busy = false; usingCredential=false; generation++; success = null; cancelled = null;
        if (callback != null) callback.run();
    }
    public void destroy() { generation++; success = null; cancelled = null; busy = false; if (prompt != null) prompt.cancelAuthentication(); }
}
