package com.omtiffin.admin;
import android.app.*;import android.content.*;import android.os.Bundle;import android.webkit.*;import android.view.accessibility.AccessibilityNodeInfo;import java.lang.reflect.*;import java.io.*;import java.nio.charset.StandardCharsets;import java.util.concurrent.*;
/** Real Android Keystore/phone-PIN lifecycle test. Web content and token are fixtures only. */
public class SessionInstrumentation extends Instrumentation {
 MainActivity activity;WebView web;
 String token="e30."+android.util.Base64.encodeToString(("{\"exp\":"+(System.currentTimeMillis()/1000+86400)+"}").getBytes(StandardCharsets.UTF_8),android.util.Base64.URL_SAFE|android.util.Base64.NO_WRAP|android.util.Base64.NO_PADDING)+".fixture";
 @Override public void onCreate(Bundle b){super.onCreate(b);start();}
 Object field(String n)throws Exception{Field f=MainActivity.class.getDeclaredField(n);f.setAccessible(true);return f.get(activity);}
 void set(String n,Object value)throws Exception{Field f=MainActivity.class.getDeclaredField(n);f.setAccessible(true);f.set(activity,value);}
 void call(String n)throws Exception{Method m=MainActivity.class.getDeclaredMethod(n);m.setAccessible(true);m.invoke(activity);}
 void launch()throws Exception{
  Intent i=new Intent(getTargetContext(),MainActivity.class);i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);activity=(MainActivity)startActivitySync(i);
  runOnMainSync(()->{try{web=(WebView)field("web");web.stopLoading();WebViewClient original=web.getWebViewClient();web.setWebViewClient(new WebViewClient(){
   @Override public void onPageStarted(WebView v,String u,android.graphics.Bitmap b){original.onPageStarted(v,u,b);}
   @Override public void onPageFinished(WebView v,String u){original.onPageFinished(v,u);}
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){return new WebResourceResponse("text/html","UTF-8",new ByteArrayInputStream("<!doctype html><html><head></head><body><h1>SESSION TEST FIXTURE</h1></body></html>".getBytes(StandardCharsets.UTF_8)));}
  });set("enrollmentOffered",true);}catch(Exception e){throw new RuntimeException(e);}});
 }
 String js(String code)throws Exception{CountDownLatch l=new CountDownLatch(1);String[] result={""};runOnMainSync(()->web.evaluateJavascript(code,s->{result[0]=s;l.countDown();}));if(!l.await(5,TimeUnit.SECONDS))throw new Exception("JS timeout");return result[0];}
 void shell(String command)throws Exception{try(android.os.ParcelFileDescriptor fd=getUiAutomation().executeShellCommand(command);FileInputStream in=new FileInputStream(fd.getFileDescriptor())){while(in.read()!=-1){}}}
 AccessibilityNodeInfo find(AccessibilityNodeInfo n,boolean edit){if(n==null)return null;if(edit&&"android.widget.EditText".contentEquals(n.getClassName()))return n;String t=String.valueOf(n.getText()).toLowerCase();if(!edit&&(t.contains("use pin")||t.contains("use screen lock")))return n;for(int i=0;i<n.getChildCount();i++){AccessibilityNodeInfo r=find(n.getChild(i),edit);if(r!=null)return r;}return null;}
 void enterPin()throws Exception{for(int i=0;i<30;i++){AccessibilityNodeInfo root=getUiAutomation().getRootInActiveWindow();AccessibilityNodeInfo edit=find(root,true);if(edit!=null){edit.performAction(AccessibilityNodeInfo.ACTION_FOCUS);shell("input text 1234");shell("input keyevent 66");Thread.sleep(800);return;}AccessibilityNodeInfo button=find(root,false);if(button!=null)button.performAction(AccessibilityNodeInfo.ACTION_CLICK);Thread.sleep(300);}throw new Exception("Phone PIN prompt not found");}
 void waitUnlocked()throws Exception{for(int i=0;i<50;i++){boolean[] unlocked={false};runOnMainSync(()->{try{unlocked[0]=!(Boolean)field("locked")&&(Boolean)field("hasWebSession");}catch(Exception e){}});if(unlocked[0])return;Thread.sleep(200);}throw new Exception("Session did not unlock");}
 @Override public void onStart(){Bundle result=new Bundle();try{
  new SecureSession(getTargetContext()).clear();launch();runOnMainSync(()->web.loadUrl(AdminRoutes.ORIGIN+"/login"));Thread.sleep(1300);
  js("sessionStorage.setItem('token',"+org.json.JSONObject.quote(token)+");history.pushState({},'', '/dashboard');");Thread.sleep(1200);
  runOnMainSync(()->{try{call("enableDeviceUnlock");}catch(Exception e){throw new RuntimeException(e);}});enterPin();Thread.sleep(700);
  if(!new SecureSession(getTargetContext()).enabled())throw new Exception("Session not saved after PIN");
  for(int cycle=1;cycle<=3;cycle++){
   runOnMainSync(()->activity.finish());Thread.sleep(500);launch();enterPin();waitUnlocked();
   if(!new SecureSession(getTargetContext()).enabled())throw new Exception("Encrypted session lost at cycle "+cycle);
   if(!org.json.JSONObject.quote(token).equals(js("sessionStorage.getItem('token')")))throw new Exception("Restored token mismatch");
  }
  result.putString("stream","PASS: real Android phone PIN + Keystore enrollment and three cold Activity reopen cycles; encrypted session retained; token restored before page scripts. Fixture web only.");finish(-1,result);
 }catch(Exception e){result.putString("stream","FAIL "+e.toString());finish(0,result);}finally{new SecureSession(getTargetContext()).clear();}}
}
