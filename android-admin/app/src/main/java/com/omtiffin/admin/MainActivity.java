package com.omtiffin.admin;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.print.PrintManager;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import org.json.JSONObject;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final int BLUE=0xff2457df, INK=0xff152742, MUTED=0xff738298;
    private WebView web;
    private LinearLayout navigation, root;
    private FrameLayout content;
    private ProgressBar progress;
    private LinearLayout networkError;
    private final Map<String,LinearLayout> tabs=new LinkedHashMap<>();
    private final ExecutorService files=Executors.newSingleThreadExecutor();
    private ValueCallback<Uri[]> fileChooser;
    private PermissionRequest cameraRequest;
    private byte[] pendingPdf;
    private boolean authenticated=false, keyboardVisible=false, pdfBusy=false;
    private String currentPath="/login";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(0xfff4f7fc);
        setContentView(root);
        root.setOnApplyWindowInsetsListener((view,insets)->{
            if(Build.VERSION.SDK_INT>=30){android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars());root.setPadding(bars.left,bars.top,bars.right,bars.bottom);keyboardVisible=insets.isVisible(WindowInsets.Type.ime());updateNavigation();}
            else root.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets;
        });
        if(Build.VERSION.SDK_INT<30)root.getViewTreeObserver().addOnGlobalLayoutListener(()->{Rect visible=new Rect();root.getWindowVisibleDisplayFrame(visible);boolean keyboard=root.getRootView().getHeight()-visible.bottom>dp(180);if(keyboard!=keyboardVisible){keyboardVisible=keyboard;updateNavigation();}});
        content=new FrameLayout(this);root.addView(content,new LinearLayout.LayoutParams(-1,0,1));
        web=new WebView(this);web.setBackgroundColor(Color.WHITE);content.addView(web,new FrameLayout.LayoutParams(-1,-1));
        progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);FrameLayout.LayoutParams progressParams=new FrameLayout.LayoutParams(-1,dp(3));progressParams.gravity=Gravity.TOP;content.addView(progress,progressParams);
        buildErrorState();buildNavigation();configureWeb();
        if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,this::back);
        if(state==null || web.restoreState(state)==null)web.loadUrl(AdminRoutes.ORIGIN+"/login");
    }
    private void configureWeb(){
        WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setJavaScriptCanOpenWindowsAutomatically(false);settings.setSupportMultipleWindows(true);settings.setMediaPlaybackRequiresUserGesture(true);
        WebView.setWebContentsDebuggingEnabled(false);
        android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        if(WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)){
            WebViewCompat.addWebMessageListener(web,"OMAdminNative",new HashSet<>(Arrays.asList(AdminRoutes.ORIGIN,"https://www.omtiffinservices.com")),(view,message,origin,mainFrame,reply)->{
                if(!mainFrame || !AdminRoutes.trustedOrigin(origin.toString()))return;
                try{JSONObject data=new JSONObject(message.getData());String type=data.optString("type");
                    if(type.equals("navigation")){String path=data.optString("path");if(!AdminRoutes.allowed(origin.toString()+path)){navigate("/dashboard");return;}currentPath=path;authenticated=data.optBoolean("authenticated") && !path.equals("/login");updateNavigation();}
                    else if(type.equals("pdf"))savePdf(data.optString("name","OM-Tiffin.pdf"),data.optString("data"));
                    else if(type.equals("print")){PrintManager manager=(PrintManager)getSystemService(PRINT_SERVICE);manager.print("OM Tiffin",web.createPrintDocumentAdapter("OM Tiffin"),null);}
                }catch(Exception ignored){toast("The app could not complete that action.");}
            });
        }
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                String url=request.getUrl().toString();if(!request.isForMainFrame())return !AdminRoutes.trustedOrigin(url);if(AdminRoutes.allowed(url))return false;
                if(AdminRoutes.trustedOrigin(url)){toast("This app is for admin access.");navigate(authenticated?"/dashboard":"/login");return true;}
                if(request.hasGesture())openExternal(request.getUrl());return true;
            }
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){progress.setVisibility(View.VISIBLE);networkError.setVisibility(View.GONE);}
            @Override public void onPageFinished(WebView view,String url){progress.setVisibility(View.GONE);if(AdminRoutes.trustedOrigin(url))installAppHooks();}
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame()){progress.setVisibility(View.GONE);networkError.setVisibility(View.VISIBLE);}}
            @Override public void onReceivedSslError(WebView view,android.webkit.SslErrorHandler handler,android.net.http.SslError error){handler.cancel();networkError.setVisibility(View.VISIBLE);}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onCreateWindow(WebView view, boolean dialog, boolean userGesture, android.os.Message resultMessage){
                if(!userGesture)return false;
                WebView popup=new WebView(MainActivity.this);
                popup.getSettings().setAllowFileAccess(false);popup.getSettings().setAllowContentAccess(false);
                popup.setWebViewClient(new WebViewClient(){
                    private boolean handled=false;
                    private void handle(String url){if(handled||url.equals("about:blank"))return;handled=true;if(AdminRoutes.allowed(url))web.loadUrl(url);else openExternal(Uri.parse(url));popup.destroy();}
                    @Override public boolean shouldOverrideUrlLoading(WebView child,WebResourceRequest request){handle(request.getUrl().toString());return true;}
                    @Override public void onPageStarted(WebView child,String url,android.graphics.Bitmap icon){handle(url);}
                });
                ((WebView.WebViewTransport)resultMessage.obj).setWebView(popup);resultMessage.sendToTarget();return true;
            }
            @Override public void onProgressChanged(WebView view,int value){progress.setProgress(value);}
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
                if(!AdminRoutes.allowed(web.getUrl()))return false;
                if(fileChooser!=null)fileChooser.onReceiveValue(null);fileChooser=callback;
                try{startActivityForResult(params.createIntent(),12);return true;}catch(Exception ignored){fileChooser=null;callback.onReceiveValue(null);toast("No file picker is available.");return false;}
            }
            @Override public void onPermissionRequest(PermissionRequest request){
                runOnUiThread(()->{
                    if(!AdminRoutes.trustedOrigin(request.getOrigin().toString()) || !Arrays.asList(request.getResources()).contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)){request.deny();return;}
                    if(checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED)request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    else{if(cameraRequest!=null)cameraRequest.deny();cameraRequest=request;requestPermissions(new String[]{Manifest.permission.CAMERA},11);}
                });
            }
            @Override public void onPermissionRequestCanceled(PermissionRequest request){if(cameraRequest==request)cameraRequest=null;}
            @Override public boolean onJsAlert(WebView view,String url,String message,android.webkit.JsResult result){new AlertDialog.Builder(MainActivity.this).setTitle("OM Tiffin").setMessage(message).setPositiveButton("OK",(d,w)->result.confirm()).setOnCancelListener(d->result.cancel()).show();return true;}
            @Override public boolean onJsConfirm(WebView view,String url,String message,android.webkit.JsResult result){new AlertDialog.Builder(MainActivity.this).setTitle("Confirm action").setMessage(message).setPositiveButton("Continue",(d,w)->result.confirm()).setNegativeButton("Cancel",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}
        });
        web.setDownloadListener((url,agent,disposition,mime,length)->{if(url.startsWith("blob:"))captureBlob(url,"OM-Tiffin.pdf");else openExternal(Uri.parse(url));});
    }
    private void installAppHooks(){
        String script="(function(){if(window.__omNativeInstalled)return;window.__omNativeInstalled=true;document.body.dataset.omNative='true';"
          +"var send=function(data){if(window.OMAdminNative)window.OMAdminNative.postMessage(JSON.stringify(data));};"
          +"var last='';var nav=function(){var current=location.pathname+'|'+Boolean(sessionStorage.getItem('token'));if(current!==last){last=current;send({type:'navigation',path:location.pathname,authenticated:Boolean(sessionStorage.getItem('token'))});}};"
          +"['pushState','replaceState'].forEach(function(name){var original=history[name];history[name]=function(){var value=original.apply(this,arguments);nav();return value;};});window.addEventListener('popstate',nav);setInterval(nav,1000);nav();"
          +"window.__omDownloadPdf=async function(url,name){try{var blob=await(await fetch(url)).blob();if(blob.size>16*1024*1024)throw Error('PDF too large');var reader=new FileReader();reader.onload=function(){send({type:'pdf',name:name||'OM-Tiffin.pdf',data:reader.result.split(',')[1]});};reader.readAsDataURL(blob);}catch(error){alert('PDF could not be opened. Please retry.');}};"
          +"document.addEventListener('click',function(event){var anchor=event.target.closest&&event.target.closest('a[download]');if(anchor&&anchor.href.startsWith('blob:')&&window.OMAdminNative){event.preventDefault();window.__omDownloadPdf(anchor.href,anchor.download);}},true);"
          +"window.print=function(){send({type:'print'});};var style=document.createElement('style');style.textContent='body[data-om-native] .om-admin-shell header h1{font-size:20px}body[data-om-native] input,body[data-om-native] select,body[data-om-native] textarea{font-size:16px}@media(max-width:600px){body[data-om-native] .om-admin-shell main{padding:0!important}body[data-om-native] .om-admin-shell .max-w-7xl{padding:18px 14px!important}body[data-om-native] .max-w-7xl>.bg-gradient-to-r{padding:20px!important;margin-bottom:16px!important}body[data-om-native] .max-w-7xl>.bg-gradient-to-r>div>div:last-child{display:none}body[data-om-native] .max-w-7xl>.bg-gradient-to-r h1{font-size:24px!important}body[data-om-native] .max-w-7xl>.grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}body[data-om-native] .max-w-7xl>.grid>div{padding:14px!important}body[data-om-native] .max-w-7xl>.grid .w-16{width:32px!important;height:32px!important;font-size:18px!important;flex-shrink:0}body[data-om-native] .max-w-7xl>.grid h2{font-size:23px!important}body[data-om-native] section[aria-label=\"Revenue filters\"]{padding:14px!important;gap:8px!important}body[data-om-native] section[aria-label=\"Revenue filters\"]>div{width:100%}body[data-om-native] section[aria-label=\"Revenue filters\"] select{padding:8px!important}body[data-om-native] section[aria-label=\"Revenue filters\"] button{display:none}}';document.head.appendChild(style);})();";
        web.evaluateJavascript(script,null);
    }
    private void captureBlob(String url,String name){web.evaluateJavascript("window.__omDownloadPdf && window.__omDownloadPdf("+JSONObject.quote(url)+","+JSONObject.quote(name)+")",null);}
    private void navigate(String path){
        if(!AdminRoutes.allowed(AdminRoutes.ORIGIN+path))return;
        if(!AdminRoutes.trustedOrigin(web.getUrl())){web.loadUrl(AdminRoutes.ORIGIN+path);return;}
        guardDrafts(()->web.evaluateJavascript("(function(){var path="+JSONObject.quote(path)+";var link=Array.from(document.querySelectorAll('a[href]')).find(function(a){return new URL(a.href).pathname===path;});if(link){link.click();return;}history.pushState({idx:(history.state&&history.state.idx||0)+1,key:String(Date.now()),usr:null},'',path);window.dispatchEvent(new PopStateEvent('popstate',{state:history.state}));})();",null));
    }
    private void guardDrafts(Runnable action){
        web.evaluateJavascript("Boolean(document.querySelector('.om-admin-shell') && /\\bUnsaved\\b/.test(document.body.innerText))",result->{if("true".equals(result))new AlertDialog.Builder(this).setTitle("Unsaved entries").setMessage("Some meal entries have not been saved. Leave this page?").setNegativeButton("Keep editing",(d,w)->{}).setPositiveButton("Leave page",(d,w)->action.run()).show();else action.run();});
    }
    private void buildNavigation(){
        navigation=new LinearLayout(this);navigation.setOrientation(LinearLayout.VERTICAL);navigation.setPadding(dp(12),dp(8),dp(12),dp(6));navigation.setBackgroundColor(Color.WHITE);navigation.setElevation(dp(12));root.addView(navigation,new LinearLayout.LayoutParams(-1,-2));
        LinearLayout quick=new LinearLayout(this);quick.setGravity(Gravity.CENTER);navigation.addView(quick,new LinearLayout.LayoutParams(-1,dp(52)));
        addQuick(quick,"Approve payments","/whatsapp-payment-approval");addQuick(quick,"Announce","/announcement");addQuick(quick,"+ Customer","/add-customer");
        LinearLayout row=new LinearLayout(this);row.setGravity(Gravity.CENTER);row.setPadding(0,dp(6),0,0);navigation.addView(row,new LinearLayout.LayoutParams(-1,dp(64)));
        addTab(row,"Home","/dashboard");addTab(row,"Customers","/customers");addTab(row,"Scan","/barcode-entry");addTab(row,"Billing","/billing");addTab(row,"More",null);updateNavigation();
    }
    private void addQuick(LinearLayout row,String label,String path){TextView button=new TextView(this);button.setText(label);button.setTextSize(11);button.setTypeface(null,android.graphics.Typeface.BOLD);button.setTextColor(BLUE);button.setGravity(Gravity.CENTER);button.setBackground(rounded(0xffedf3ff,10));LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(0,dp(48),1);params.setMargins(dp(3),0,dp(3),0);row.addView(button,params);button.setContentDescription(label);button.setOnClickListener(view->navigate(path));}
    private void addTab(LinearLayout row,String title,String path){LinearLayout button=new LinearLayout(this);button.setOrientation(LinearLayout.VERTICAL);button.setGravity(Gravity.CENTER);button.setPadding(0,dp(5),0,dp(5));button.setContentDescription(title);button.setClickable(true);button.setFocusable(true);NavIcon icon=new NavIcon(title);button.addView(icon,new LinearLayout.LayoutParams(dp(24),dp(24)));TextView label=new TextView(this);label.setText(title);label.setTextSize(10);label.setTextColor(MUTED);label.setGravity(Gravity.CENTER);LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);lp.topMargin=dp(4);button.addView(label,lp);row.addView(button,new LinearLayout.LayoutParams(0,-1,1));tabs.put(title,button);button.setOnClickListener(view->{if(path==null)showMore();else navigate(path);});}
    private void updateNavigation(){if(navigation==null)return;navigation.setVisibility(authenticated&&!keyboardVisible?View.VISIBLE:View.GONE);String active=AdminRoutes.tab(currentPath);for(Map.Entry<String,LinearLayout> item:tabs.entrySet()){boolean selected=item.getKey().equals(active);item.getValue().setBackground(rounded(selected?0xffedf3ff:Color.TRANSPARENT,14));((NavIcon)item.getValue().getChildAt(0)).setColor(selected?BLUE:MUTED);((TextView)item.getValue().getChildAt(1)).setTextColor(selected?BLUE:MUTED);}}
    private void showMore(){
        Dialog dialog=new Dialog(this);LinearLayout panel=new LinearLayout(this);panel.setOrientation(LinearLayout.VERTICAL);panel.setPadding(dp(20),dp(22),dp(20),dp(18));panel.setBackground(rounded(Color.WHITE,24));TextView title=new TextView(this);title.setText("Your admin workspace");title.setTextSize(21);title.setTypeface(null,android.graphics.Typeface.BOLD);title.setTextColor(INK);panel.addView(title);TextView subtitle=new TextView(this);subtitle.setText("Daily tools and settings");subtitle.setTextColor(MUTED);subtitle.setPadding(0,dp(6),0,dp(12));panel.addView(subtitle);
        ScrollView scroll=new ScrollView(this);LinearLayout list=new LinearLayout(this);list.setOrientation(LinearLayout.VERTICAL);scroll.addView(list);panel.addView(scroll,new LinearLayout.LayoutParams(-1,dp(380)));
        String[][] items={{"Daily entry","/daily-entry"},{"Payments","/payments"},{"Payment approval","/whatsapp-payment-approval"},{"WhatsApp inbox","/whatsapp-inbox"},{"Announcements","/announcement"},{"Add customer","/add-customer"},{"Website orders","/website-orders"},{"Tiffin requests","/customer-modification-requests"},{"View bills","/view-bills"},{"Bill delivery","/bill-delivery-status"},{"Announcement delivery","/announcement-delivery-status"},{"Customer login IDs","/customer-login-id-sender"},{"Price settings","/price-settings"},{"Users","/users"},{"Website menu","/website-menu"},{"Website reviews","/website-reviews"},{"Website settings","/website-settings"},{"Tiffin request settings","/customer-modification-settings"},{"Business information","/business-info"}};
        for(String[] item:items){TextView button=new TextView(this);button.setText(item[0]+"   ›");button.setTextSize(15);button.setTextColor(INK);button.setPadding(dp(10),dp(14),dp(10),dp(14));button.setBackground(rounded(0xfff4f7fc,10));LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2);params.bottomMargin=dp(6);list.addView(button,params);button.setOnClickListener(view->{dialog.dismiss();navigate(item[1]);});}
        Button refresh=new Button(this);refresh.setText("Refresh current page");refresh.setOnClickListener(view->{dialog.dismiss();guardDrafts(web::reload);});panel.addView(refresh);
        dialog.setContentView(panel);android.view.Window window=dialog.getWindow();if(window!=null){window.setBackgroundDrawableResource(android.R.color.transparent);window.setLayout(-1,-2);window.setGravity(Gravity.BOTTOM);}dialog.show();if(window!=null)window.setLayout(-1,-2);
    }
    private void buildErrorState(){networkError=new LinearLayout(this);networkError.setOrientation(LinearLayout.VERTICAL);networkError.setGravity(Gravity.CENTER);networkError.setPadding(dp(30),dp(30),dp(30),dp(30));networkError.setBackgroundColor(0xfff4f7fc);TextView title=new TextView(this);title.setText("Let's reconnect");title.setTextColor(INK);title.setTextSize(24);title.setTypeface(null,android.graphics.Typeface.BOLD);networkError.addView(title);TextView message=new TextView(this);message.setText("Check your internet connection and try again.");message.setTextColor(MUTED);message.setGravity(Gravity.CENTER);message.setPadding(0,dp(12),0,dp(20));networkError.addView(message);Button retry=new Button(this);retry.setText("Try again");retry.setOnClickListener(view->{networkError.setVisibility(View.GONE);web.reload();});networkError.addView(retry);networkError.setVisibility(View.GONE);content.addView(networkError,new FrameLayout.LayoutParams(-1,-1));}
    private void savePdf(String name,String data){
        if(pdfBusy){toast("Finish saving the current PDF first.");return;}if(data.length()>24*1024*1024){toast("This PDF is too large.");return;}pdfBusy=true;
        files.execute(()->{try{byte[] bytes=Base64.decode(data,Base64.DEFAULT);if(bytes.length<5||!new String(bytes,0,5,StandardCharsets.US_ASCII).equals("%PDF-"))throw new IllegalArgumentException();runOnUiThread(()->{pendingPdf=bytes;String filename=name.replaceAll("[\\\\/:*?\"<>|]","_");if(!filename.toLowerCase(Locale.ROOT).endsWith(".pdf"))filename+=".pdf";Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("application/pdf");intent.putExtra(Intent.EXTRA_TITLE,filename.substring(0,Math.min(filename.length(),120)));try{startActivityForResult(intent,13);}catch(Exception error){pendingPdf=null;pdfBusy=false;toast("No document saver is available.");}});}catch(Exception error){runOnUiThread(()->{pdfBusy=false;toast("Only valid PDF receipts and bills can be saved.");});}});
    }
    private void openExternal(Uri uri){String scheme=uri.getScheme();if(!Arrays.asList("https","tel","mailto","whatsapp").contains(scheme)){toast("This link cannot be opened in the admin app.");return;}try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){toast("No app can open this link.");}}
    private void back(){guardDrafts(()->{if(web.canGoBack())web.goBack();else finish();});}
    @Override public void onBackPressed(){back();}
    @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] results){super.onRequestPermissionsResult(request,permissions,results);if(request==11&&cameraRequest!=null){if(results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED)cameraRequest.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});else cameraRequest.deny();cameraRequest=null;}}
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==12&&fileChooser!=null){fileChooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileChooser=null;}if(request==13){byte[] bytes=pendingPdf;pendingPdf=null;pdfBusy=false;if(result==RESULT_OK&&data!=null&&data.getData()!=null&&bytes!=null){Uri target=data.getData();files.execute(()->{try(OutputStream stream=getContentResolver().openOutputStream(target)){if(stream==null)throw new IllegalStateException();stream.write(bytes);runOnUiThread(()->toast("PDF saved successfully."));}catch(Exception error){runOnUiThread(()->toast("PDF could not be saved. Please retry."));}});}}}
    @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);web.saveState(state);}
    @Override protected void onResume(){super.onResume();if(web!=null){web.onResume();web.evaluateJavascript("window.dispatchEvent(new Event('focus'))",null);}}
    @Override protected void onPause(){if(web!=null)web.onPause();super.onPause();}
    @Override protected void onDestroy(){if(fileChooser!=null)fileChooser.onReceiveValue(null);if(cameraRequest!=null)cameraRequest.deny();pendingPdf=null;web.destroy();files.shutdown();super.onDestroy();}
    private int dp(float value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private GradientDrawable rounded(int color,int radius){GradientDrawable shape=new GradientDrawable();shape.setColor(color);shape.setCornerRadius(dp(radius));return shape;}
    private void toast(String message){Toast.makeText(this,message,Toast.LENGTH_SHORT).show();}
    private class NavIcon extends View {
        private final String icon;private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);private int color=MUTED;
        NavIcon(String icon){super(MainActivity.this);this.icon=icon;}void setColor(int color){this.color=color;invalidate();}
        @Override protected void onDraw(Canvas canvas){super.onDraw(canvas);canvas.save();canvas.scale(getWidth()/24f,getHeight()/24f);paint.setColor(color);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(1.8f);paint.setStrokeCap(Paint.Cap.ROUND);paint.setStrokeJoin(Paint.Join.ROUND);Path path=new Path();
            switch(icon){case "Home":path.moveTo(3,10);path.lineTo(12,3);path.lineTo(21,10);path.moveTo(5,9);path.lineTo(5,21);path.lineTo(19,21);path.lineTo(19,9);path.moveTo(9,21);path.lineTo(9,14);path.lineTo(15,14);path.lineTo(15,21);canvas.drawPath(path,paint);break;
            case "Customers":canvas.drawCircle(9,7,3,paint);canvas.drawCircle(18,8,2.4f,paint);canvas.drawArc(3,13,15,25,180,180,false,paint);canvas.drawArc(15,13,23,23,180,170,false,paint);break;
            case "Scan":for(int[] corner:new int[][]{{3,3},{17,3},{3,17},{17,17}}){canvas.drawLine(corner[0],corner[1],corner[0]+4,corner[1],paint);canvas.drawLine(corner[0],corner[1],corner[0],corner[1]+4,paint);}canvas.drawLine(7,7,7,17,paint);canvas.drawLine(10,7,10,17,paint);canvas.drawLine(14,7,14,17,paint);canvas.drawLine(17,7,17,17,paint);break;
            case "Billing":canvas.drawRoundRect(5,3,19,21,2,2,paint);canvas.drawLine(8,8,16,8,paint);canvas.drawLine(8,12,16,12,paint);canvas.drawLine(8,16,13,16,paint);break;
            default:for(int x:new int[]{6,16})for(int y:new int[]{6,16})canvas.drawRoundRect(x-2,y-2,x+2,y+2,1,1,paint);
            }canvas.restore();}
    }
}
