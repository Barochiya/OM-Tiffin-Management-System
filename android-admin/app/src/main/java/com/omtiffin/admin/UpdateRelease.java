package com.omtiffin.admin;
import java.net.URI;
import org.json.JSONObject;
final class UpdateRelease {
 final int code;final String version,url,notes;
 private UpdateRelease(int c,String v,String u,String n){code=c;version=v;url=u;notes=n;}
 static UpdateRelease parse(JSONObject json)throws Exception{
  int code=json.getInt("versionCode");String version=json.getString("versionName"),url=json.getString("apkUrl");URI uri=new URI(url);
  if(code<1||!version.matches("[0-9]+\\.[0-9]+\\.[0-9]+")||!"https".equals(uri.getScheme())||!"expo.dev".equals(uri.getHost())||uri.getUserInfo()!=null||uri.getPort()!=-1||uri.getQuery()!=null||uri.getFragment()!=null||!uri.getPath().matches("/artifacts/eas/[A-Za-z0-9_-]+\\.apk"))throw new IllegalArgumentException("Invalid release");
  String notes=json.optString("notes","A new app version is available.");if(notes.length()>2000)throw new IllegalArgumentException("Release notes too large");return new UpdateRelease(code,version,url,notes);
 }
}
