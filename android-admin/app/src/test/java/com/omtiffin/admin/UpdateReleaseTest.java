package com.omtiffin.admin;
import org.junit.Test;
import org.json.JSONObject;
import static org.junit.Assert.*;
public class UpdateReleaseTest {
 private JSONObject release(String url)throws Exception{return new JSONObject().put("versionCode",8).put("versionName","0.4.2").put("apkUrl",url);}
 @Test public void acceptsExpoHttpsArtifact()throws Exception{assertEquals(8,UpdateRelease.parse(release("https://expo.dev/artifacts/eas/test_123.apk")).code);}
 @Test public void rejectsUntrustedDownloads()throws Exception{for(String url:new String[]{"http://expo.dev/artifacts/eas/test.apk","https://evil.test/app.apk","https://expo.dev@evil.test/artifacts/eas/test.apk","https://expo.dev/artifacts/eas/test.apk?redirect=evil","https://expo.dev/other.apk"}){try{UpdateRelease.parse(release(url));fail(url);}catch(IllegalArgumentException expected){}}}
 @Test public void rejectsInvalidVersion()throws Exception{try{UpdateRelease.parse(release("https://expo.dev/artifacts/eas/test.apk").put("versionCode",0));fail();}catch(IllegalArgumentException expected){}}
}