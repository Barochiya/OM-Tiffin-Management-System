package com.omtiffin.admin;
import android.app.Instrumentation;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.widget.TextView;
import android.widget.LinearLayout;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/** Captures the real native APK using only local frontend assets and demo APIs. */
public class ScreenshotInstrumentation extends Instrumentation {
 private MainActivity activity;
 private WebView web;
 private int deliveryStage=0;
 @Override public void onCreate(Bundle args){super.onCreate(args);start();}
 @Override public void onStart(){
  Bundle result=new Bundle();
  try{
   Intent intent=new Intent(getTargetContext(),MainActivity.class);intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
   activity=(MainActivity)startActivitySync(intent);
   runOnMainSync(()->{
    try{Field field=MainActivity.class.getDeclaredField("web");field.setAccessible(true);web=(WebView)field.get(activity);WebViewClient original=web.getWebViewClient();web.stopLoading();
     web.setWebViewClient(new WebViewClient(){
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return original.shouldOverrideUrlLoading(view,request);}
      @Override public void onPageFinished(WebView view,String url){original.onPageFinished(view,url);}
      @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
       String host=request.getUrl().getHost(),path=request.getUrl().getPath();
       if(host!=null && (host.equals("om-tiffin-backend.onrender.com")||path.startsWith("/api/")))return json(path.endsWith("/meal-deliveries")?deliveryFixture(request.getMethod()):fixture(path));
       if(AdminRoutes.trustedOrigin(request.getUrl().toString())){try{String file=path.startsWith("/assets/")||path.endsWith(".png")?path.substring(1):"index.html";String mime=file.endsWith(".js")?"text/javascript":file.endsWith(".css")?"text/css":file.endsWith(".png")?"image/png":"text/html";return new WebResourceResponse(mime,"UTF-8",getContext().getAssets().open(file));}catch(Exception error){return json("{}");}}
       return json("{}");
      }
     });
     LinearLayout root=(LinearLayout)((android.view.ViewGroup)activity.findViewById(android.R.id.content)).getChildAt(0);
     TextView demo=new TextView(activity);demo.setText("APP SCREENSHOTS · DEMO DATA");demo.setTextColor(0xff738298);demo.setTextSize(10);demo.setGravity(android.view.Gravity.CENTER);demo.setPadding(0,6,0,6);root.addView(demo,0,new LinearLayout.LayoutParams(-1,-2));
     web.loadUrl(AdminRoutes.ORIGIN+"/login");
    }catch(Exception error){throw new RuntimeException(error);}
   });
   waitFor("Boolean(document.querySelector('input[type=password]'))");take("android-login.png");
   evaluate("var demoOpen=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(method,url){arguments[1]=String(url).replace('https://om-tiffin-backend.onrender.com','https://www.omtiffinservices.com');return demoOpen.apply(this,arguments);};sessionStorage.setItem('token','demo-only-token');history.pushState({idx:1,key:'demo',usr:null},'','/dashboard');window.dispatchEvent(new PopStateEvent('popstate',{state:history.state}));");
   waitFor("Boolean(document.querySelector('select[aria-label]'))");Thread.sleep(1500);take("android-home.png");
   runOnMainSync(()->{try{Method method=MainActivity.class.getDeclaredMethod("navigate",String.class);method.setAccessible(true);method.invoke(activity,"/customers");}catch(Exception error){throw new RuntimeException(error);}});waitFor("document.body.innerText.includes('Demo Customer')");Thread.sleep(500);take("android-customers.png");
   runOnMainSync(()->{try{Method method=MainActivity.class.getDeclaredMethod("showMore");method.setAccessible(true);method.invoke(activity);}catch(Exception error){throw new RuntimeException(error);}});Thread.sleep(500);take("android-more.png");
   runOnMainSync(()->{try{Field field=MainActivity.class.getDeclaredField("toolsDialog");field.setAccessible(true);((android.app.Dialog)field.get(activity)).dismiss();Method method=MainActivity.class.getDeclaredMethod("showUpdatePanel",UpdateRelease.class,String.class,boolean.class);method.setAccessible(true);UpdateRelease release=UpdateRelease.parse(new org.json.JSONObject("{\"versionCode\":10,\"versionName\":\"0.7.0\",\"apkUrl\":\"https://expo.dev/artifacts/eas/demo.apk\",\"notes\":\"Delivery pins, swipe confirmations and a refreshed workspace.\"}"));method.invoke(activity,release,"0.6.0",true);}catch(Exception error){throw new RuntimeException(error);}});Thread.sleep(500);take("android-update.png");
   runOnMainSync(()->{try{Field field=MainActivity.class.getDeclaredField("toolsDialog");field.setAccessible(true);((android.app.Dialog)field.get(activity)).dismiss();Method method=MainActivity.class.getDeclaredMethod("navigate",String.class);method.setAccessible(true);method.invoke(activity,"/meal-deliveries");}catch(Exception error){throw new RuntimeException(error);}});
   waitFor("Boolean(document.querySelector('.delivery-swipe button'))");evaluate("document.querySelector('select[aria-label=\"Delivery meal\"]').value='Lunch'");
   swipe();waitFor("document.body.innerText.includes('Swipe: Delivered')");swipe();waitFor("document.body.innerText.includes('Handover confirmed')");take("android-delivery-touch.png");if(deliveryStage!=2)throw new IllegalStateException("Unexpected delivery writes: "+deliveryStage);
   result.putString("stream","PASS real Android screenshots and injected touchscreen dispatch/delivered with intercepted demo APIs\n");finish(ActivityResult.OK,result);
  }catch(Exception error){result.putString("stream","FAIL "+error.toString());finish(ActivityResult.FAIL,result);}
 }
 private static class ActivityResult{static final int OK=-1,FAIL=0;}
 private WebResourceResponse json(String value){return new WebResourceResponse("application/json","UTF-8",new ByteArrayInputStream(value.getBytes(StandardCharsets.UTF_8)));}
 private String deliveryFixture(String method){
  if(method.equals("POST")){deliveryStage++;return "{\"success\":true,\"data\":"+deliveryRecord()+"}";}
  return "{\"success\":true,\"whatsappConfigured\":false,\"data\":["+(deliveryStage>0?deliveryRecord():"")+"]}";
 }
 private String deliveryRecord(){String meal=java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Kolkata")).getHour()<17?"Lunch":"Dinner";return "{\"customer\":\"507f1f77bcf86cd799439011\",\"meal\":\""+meal+"\",\"status\":\""+(deliveryStage==1?"Out for delivery":"Delivered")+"\"}";}
 private void swipe()throws Exception{
  evaluate("document.querySelector('.delivery-swipe button').scrollIntoView({block:'center'})");Thread.sleep(300);
  String raw=evaluate("JSON.stringify((()=>{const b=document.querySelector('.delivery-swipe button').getBoundingClientRect(),t=document.querySelector('.delivery-swipe').getBoundingClientRect();return {x:b.x+20,y:b.y+20,end:b.x+20+t.width-58,w:innerWidth}})())");org.json.JSONObject point=new org.json.JSONObject(new org.json.JSONObject("{\"v\":"+raw+"}").getString("v"));
  int[] location=new int[2];int[] width=new int[1];runOnMainSync(()->{web.getLocationOnScreen(location);width[0]=web.getWidth();});float scale=(float)(width[0]/point.getDouble("w")),x=location[0]+(float)point.getDouble("x")*scale,y=location[1]+(float)point.getDouble("y")*scale,end=location[0]+(float)point.getDouble("end")*scale;long down=android.os.SystemClock.uptimeMillis();
  for(int i=0;i<=14;i++){int action=i==0?android.view.MotionEvent.ACTION_DOWN:i==14?android.view.MotionEvent.ACTION_UP:android.view.MotionEvent.ACTION_MOVE;android.view.MotionEvent event=android.view.MotionEvent.obtain(down,android.os.SystemClock.uptimeMillis(),action,x+(end-x)*Math.min(i,13)/13,y,0);event.setSource(android.view.InputDevice.SOURCE_TOUCHSCREEN);getUiAutomation().injectInputEvent(event,true);event.recycle();Thread.sleep(25);}
 }
 private String fixture(String raw){String path=raw.replaceFirst("^/api","");
  if(path.equals("/dashboard/notifications"))return "{\"total\":3,\"categories\":[{\"id\":\"payments\",\"title\":\"Payment screenshots awaiting review\",\"count\":2,\"path\":\"/whatsapp-payment-approval\"},{\"id\":\"modifications\",\"title\":\"Tiffin requests awaiting approval\",\"count\":1,\"path\":\"/customer-modification-requests\"}],\"unavailable\":[],\"updatedAt\":\"2026-10-08T10:00:00Z\"}";
  if(path.equals("/dashboard"))return "{\"stats\":{\"totalCustomers\":33,\"activeCustomers\":31,\"totalRevenue\":129275,\"totalPending\":1260},\"todayCollection\":22500,\"todayMeals\":64,\"period\":{\"label\":\"All time\",\"chartYear\":2026},\"availableYears\":[2026,2025],\"growth\":{\"revenue\":{\"percent\":null,\"label\":\"All-time collections\"},\"active\":{\"percent\":93.9,\"share\":true,\"label\":\"of registered customers\"},\"pending\":{\"percent\":null,\"label\":\"Current outstanding\"},\"customers\":{\"percent\":null,\"label\":\"Current total\"},\"collection\":{\"percent\":25,\"label\":\"vs yesterday\"},\"meals\":{\"percent\":6.7,\"label\":\"vs yesterday\"}},\"revenueChart\":[{\"month\":\"Sep\",\"revenue\":36000},{\"month\":\"Oct\",\"revenue\":42200}],\"recentPayments\":[],\"pendingBills\":[],\"topCustomers\":[]}";
  if(path.equals("/tiffins/stats"))return "{\"success\":true,\"data\":{\"totalCustomers\":2,\"activeCustomers\":2,\"inactiveCustomers\":0}}";
  if(path.equals("/tiffins"))return "{\"success\":true,\"totalPages\":1,\"total\":2,\"data\":[{\"_id\":\"507f1f77bcf86cd799439011\",\"customerName\":\"Demo Customer One\",\"phone\":\"0000000000\",\"address\":\"Demo address, Gandhinagar\",\"status\":\"Active\",\"mealType\":\"Both\",\"pricing\":{\"pricingType\":\"default\"}},{\"_id\":\"507f1f77bcf86cd799439012\",\"customerName\":\"Demo Customer Two\",\"phone\":\"0000000000\",\"address\":\"Demo address, Gandhinagar\",\"status\":\"Active\",\"mealType\":\"Dinner\",\"pricing\":{\"pricingType\":\"default\"}}]}";
  return "{\"success\":true,\"data\":[],\"accounts\":[]}";
 }
 private String evaluate(String script)throws Exception{CountDownLatch latch=new CountDownLatch(1);String[] value={""};runOnMainSync(()->web.evaluateJavascript(script,result->{value[0]=result;latch.countDown();}));if(!latch.await(5,TimeUnit.SECONDS))throw new IllegalStateException("JavaScript timed out");return value[0];}
 private void waitFor(String script)throws Exception{for(int i=0;i<60;i++){if(evaluate(script).equals("true"))return;Thread.sleep(500);}take("android-failure.png");throw new IllegalStateException("Page not ready: "+evaluate("location.href + document.body.innerText"));}
 private void take(String name)throws Exception{Bitmap screenshot=getUiAutomation().takeScreenshot();File folder=new File(getTargetContext().getExternalFilesDir(null),"screenshots");folder.mkdirs();try(FileOutputStream out=new FileOutputStream(new File(folder,name))){screenshot.compress(Bitmap.CompressFormat.PNG,100,out);}screenshot.recycle();}
}
