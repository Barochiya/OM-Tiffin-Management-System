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

public class MainActivity extends androidx.fragment.app.FragmentActivity {
    private static final int BLUE=0xff176b52, INK=0xff182e2c, MUTED=0xff70817c;
    private WebView web;
    private LinearLayout navigation, root;
    private FrameLayout content;
    private ProgressBar progress;
    private LinearLayout networkError;
    private TextView connectionMessage;
    private LinearLayout startupCover;
    private final android.os.Handler startupHandler=new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable startupTimeout=()->showConnectionError("The page is taking too long to load. Check your connection, then try again.");
    private void showConnectionError(String message){startupHandler.removeCallbacks(startupTimeout);progress.setVisibility(View.GONE);startupCover.setVisibility(View.GONE);connectionMessage.setText(message);networkError.setVisibility(View.VISIBLE);}

    private final Map<String,LinearLayout> tabs=new LinkedHashMap<>();
    private final ExecutorService files=Executors.newSingleThreadExecutor();
    private ValueCallback<Uri[]> fileChooser;
    private PermissionRequest cameraRequest;
    private byte[] pendingPdf;
    private boolean authenticated=false, keyboardVisible=false, pdfBusy=false;
    private String currentPath="/login";
    private SecureSession secureSession;
    private DeviceUnlock deviceUnlock;
    private LinearLayout deviceLock;
    private Dialog toolsDialog;
    private boolean locked=false, enrollmentOffered=false, promptOnResume=false, hasWebSession=false;
    private String observedToken="", pendingRestore=null;
    private androidx.webkit.ScriptHandler restoreScript; private int restorationGeneration;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(0xfff5f6f1);
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
        startupCover=new LinearLayout(this);startupCover.setOrientation(LinearLayout.VERTICAL);startupCover.setGravity(Gravity.CENTER);startupCover.setBackgroundColor(0xfff5f6f1);startupCover.setPadding(dp(24),dp(24),dp(24),dp(24));
        TextView startupBrand=new TextView(this);startupBrand.setText("OM TIFFIN");startupBrand.setTextColor(BLUE);startupBrand.setTextSize(26);startupBrand.setTypeface(null,android.graphics.Typeface.BOLD);startupCover.addView(startupBrand);
        TextView startupText=new TextView(this);startupText.setText("Opening your workspace...");startupText.setTextColor(MUTED);startupText.setPadding(0,dp(14),0,dp(22));startupCover.addView(startupText);startupCover.addView(new ProgressBar(this),new LinearLayout.LayoutParams(dp(32),dp(32)));content.addView(startupCover,new FrameLayout.LayoutParams(-1,-1));startupCover.setVisibility(View.GONE);
        secureSession=new SecureSession(this);deviceUnlock=new DeviceUnlock(this);
        buildErrorState();buildNavigation();configureWeb();buildDeviceLock();
        if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,this::back);
        // A new WebView is not populated with a remembered token until Android authentication succeeds.
        if(secureSession.enabled()){setDeviceLocked(true);promptOnResume=true;}
        else web.loadUrl(AdminRoutes.ORIGIN+"/login");
    }
    private void configureWeb(){
        WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setJavaScriptCanOpenWindowsAutomatically(false);settings.setSupportMultipleWindows(true);settings.setMediaPlaybackRequiresUserGesture(true);
        WebView.setWebContentsDebuggingEnabled(false);
        android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        if(WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)){
            WebViewCompat.addWebMessageListener(web,"OMAdminNative",new HashSet<>(Arrays.asList(AdminRoutes.ORIGIN,"https://omtiffinservices.com")),(view,message,origin,mainFrame,reply)->{
                if(locked || !mainFrame || !AdminRoutes.trustedOrigin(origin.toString()))return;
                try{JSONObject data=new JSONObject(message.getData());String type=data.optString("type");
                    if(type.equals("navigation")){String path=data.optString("path");if(!AdminRoutes.allowed(origin.toString()+path)){navigate("/dashboard");return;}currentPath=path;authenticated=data.optBoolean("authenticated") && !path.equals("/login");updateNavigation();if(authenticated)offerDeviceUnlock();}
                    else if(type.equals("forgetSession")){secureSession.clear();observedToken="";hasWebSession=false;authenticated=false;enrollmentOffered=false;updateNavigation();web.evaluateJavascript("window.__omLogoutAfterForget && window.__omLogoutAfterForget()",null);}
                    else if(type.equals("session")){observeSession(data.optString("token"));}
                    else if(type.equals("workspaceNavigate") && authenticated){navigate(data.optString("path"),data.optString("mode","home"));}
                    else if(type.equals("workspaceMore") && authenticated){showMore();}
                    else if(type.equals("workspaceRefresh") && authenticated){guardDrafts(web::reload);}
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
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){startupCover.setVisibility(View.VISIBLE);progress.setVisibility(View.VISIBLE);networkError.setVisibility(View.GONE);startupHandler.removeCallbacks(startupTimeout);startupHandler.postDelayed(startupTimeout,30000);}
            @Override public void onPageFinished(WebView view,String url){
                startupHandler.removeCallbacks(startupTimeout);startupCover.setVisibility(View.GONE);progress.setVisibility(View.GONE);
                if(!AdminRoutes.trustedOrigin(url))return;
                if(restoreScript!=null && pendingRestore!=null){
                    final int attempt=restorationGeneration;String expected=pendingRestore;restoreScript.remove();restoreScript=null;
                    web.evaluateJavascript("sessionStorage.getItem('token')",result->{
                        if(attempt!=restorationGeneration)return;pendingRestore=null;
                        if(JSONObject.quote(expected).equals(result)){hasWebSession=true;setDeviceLocked(false);installAppHooks();}
                        else{toast("The saved session was rejected. Please sign in again.");usePasswordLogin();}
                    });return;
                }
                if(pendingRestore!=null){final int attempt=restorationGeneration;String token=pendingRestore;pendingRestore=null;
                    web.evaluateJavascript("sessionStorage.setItem('token',"+JSONObject.quote(token)+")",result->{if(attempt!=restorationGeneration)return;hasWebSession=true;setDeviceLocked(false);web.loadUrl(AdminRoutes.ORIGIN+"/dashboard");});
                }else installAppHooks();
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame())showConnectionError("Unable to connect ("+error.getErrorCode()+"). Check your internet connection and try again.");}
            @Override public void onReceivedHttpError(WebView view,WebResourceRequest request,android.webkit.WebResourceResponse response){if(request.isForMainFrame())showConnectionError("The server returned HTTP "+response.getStatusCode()+". Please try again shortly.");}
            @Override public void onReceivedSslError(WebView view,android.webkit.SslErrorHandler handler,android.net.http.SslError error){handler.cancel();showConnectionError("A secure connection could not be established. Check the phone date and time and try again.");}
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
          +"window.print=function(){send({type:'print'});};})();";
        web.evaluateJavascript(script,null);
        String css=readAsset("app-workspace.css");
        web.evaluateJavascript("(function(){if(document.getElementById('om-app-style'))return;var style=document.createElement('style');style.id='om-app-style';style.textContent="+JSONObject.quote(css)+";document.head.appendChild(style);})();",null);
        web.evaluateJavascript(readAsset("app-workspace.js"),null);
        web.evaluateJavascript(readAsset("app-session.js"),null);
    }
    private String readAsset(String name){
        try(java.io.InputStream input=getAssets().open(name);java.io.ByteArrayOutputStream output=new java.io.ByteArrayOutputStream()){
            byte[] buffer=new byte[4096];int count;while((count=input.read(buffer))!=-1)output.write(buffer,0,count);
            return new String(output.toByteArray(),StandardCharsets.UTF_8);
        }catch(java.io.IOException error){toast("App layout could not load. Please reopen the app.");return "";}
    }
    private void captureBlob(String url,String name){web.evaluateJavascript("window.__omDownloadPdf && window.__omDownloadPdf("+JSONObject.quote(url)+","+JSONObject.quote(name)+")",null);}
    private void navigate(String path){navigate(path,"home");}
    private void navigate(String path,String mode){
        if(locked)return;
        if(!AdminRoutes.allowed(AdminRoutes.ORIGIN+path))return;
        if(!AdminRoutes.trustedOrigin(web.getUrl())){web.loadUrl(AdminRoutes.ORIGIN+path);return;}
        guardDrafts(()->web.evaluateJavascript("(function(){var path="+JSONObject.quote(path)+";var link=Array.from(document.querySelectorAll('a[href]')).find(function(a){return new URL(a.href).pathname===path;});if(link){link.click();}else{history.pushState({idx:(history.state&&history.state.idx||0)+1,key:String(Date.now()),usr:null},'',path);window.dispatchEvent(new PopStateEvent('popstate',{state:history.state}));}if(path==='/dashboard'&&window.__omWorkspaceHome)window.__omWorkspaceHome("+JSONObject.quote(mode)+");})();",null));
    }
    private void guardDrafts(Runnable action){
        if(locked)return;
        web.evaluateJavascript("Boolean(document.querySelector('.om-admin-shell') && /\\bUnsaved\\b/.test(document.body.innerText))",result->{if("true".equals(result))new AlertDialog.Builder(this).setTitle("Unsaved entries").setMessage("Some meal entries have not been saved. Leave this page?").setNegativeButton("Keep editing",(d,w)->{}).setPositiveButton("Leave page",(d,w)->action.run()).show();else action.run();});
    }
    private void buildNavigation(){
        navigation=new LinearLayout(this);navigation.setOrientation(LinearLayout.VERTICAL);navigation.setPadding(dp(12),dp(8),dp(12),dp(6));navigation.setBackgroundColor(Color.WHITE);navigation.setElevation(dp(3));root.addView(navigation,new LinearLayout.LayoutParams(-1,-2));
        LinearLayout row=new LinearLayout(this);row.setGravity(Gravity.CENTER);navigation.addView(row,new LinearLayout.LayoutParams(-1,dp(64)));
        addTab(row,"Home","/dashboard");addTab(row,"Customers","/customers");addTab(row,"Scan","/barcode-entry");addTab(row,"Billing","/billing");addTab(row,"More",null);updateNavigation();
    }
    private void addTab(LinearLayout row,String title,String path){LinearLayout button=new LinearLayout(this);button.setOrientation(LinearLayout.VERTICAL);button.setGravity(Gravity.CENTER);button.setPadding(0,dp(5),0,dp(5));button.setContentDescription(title);button.setClickable(true);button.setFocusable(true);NavIcon icon=new NavIcon(title);button.addView(icon,new LinearLayout.LayoutParams(dp(24),dp(24)));TextView label=new TextView(this);label.setText(title);label.setTextSize(11);label.setTextColor(MUTED);label.setGravity(Gravity.CENTER);LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);lp.topMargin=dp(4);button.addView(label,lp);row.addView(button,new LinearLayout.LayoutParams(0,-1,1));tabs.put(title,button);button.setOnClickListener(view->{if(path==null)showMore();else navigate(path);});}
    private void updateNavigation(){if(navigation==null)return;navigation.setVisibility(authenticated&&!keyboardVisible&&!locked?View.VISIBLE:View.GONE);String active=AdminRoutes.tab(currentPath);for(Map.Entry<String,LinearLayout> item:tabs.entrySet()){boolean selected=item.getKey().equals(active);item.getValue().setBackground(rounded(selected?0xffeaf0e2:Color.TRANSPARENT,14));((NavIcon)item.getValue().getChildAt(0)).setColor(selected?BLUE:MUTED);((TextView)item.getValue().getChildAt(1)).setTextColor(selected?BLUE:MUTED);}}
    private void showMore(){
        if(locked)return;
        Dialog dialog=new Dialog(this);toolsDialog=dialog;
        LinearLayout panel=new LinearLayout(this);panel.setOrientation(LinearLayout.VERTICAL);panel.setPadding(dp(20),dp(22),dp(20),dp(18));panel.setBackground(rounded(0xfff5f6f1,24));
        TextView title=new TextView(this);title.setText("All your tools");title.setTextSize(24);title.setTypeface(null,android.graphics.Typeface.BOLD);title.setTextColor(INK);panel.addView(title);
        TextView subtitle=new TextView(this);subtitle.setText("Everything you need, in one place.");subtitle.setTextColor(MUTED);subtitle.setPadding(0,dp(6),0,dp(16));panel.addView(subtitle);
        android.widget.EditText search=new android.widget.EditText(this);search.setSingleLine(true);search.setHint("Search tools");search.setTextSize(16);search.setTextColor(INK);search.setPadding(dp(14),0,dp(14),0);search.setBackground(rounded(Color.WHITE,12));panel.addView(search,new LinearLayout.LayoutParams(-1,dp(50)));
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);LinearLayout list=new LinearLayout(this);list.setOrientation(LinearLayout.VERTICAL);scroll.addView(list);int height=Math.min(dp(380),(int)(getResources().getDisplayMetrics().heightPixels*.45f));panel.addView(scroll,new LinearLayout.LayoutParams(-1,height));
        String[][] items={
          {"Daily work","Tiffin deliveries","/meal-deliveries"},{"Daily work","Daily entry","/daily-entry"},{"Daily work","Scan a tiffin","/barcode-entry"},{"Daily work","Customers","/customers"},{"Daily work","Add customer","/add-customer"},{"Daily work","Tiffin requests","/customer-modification-requests"},
          {"Money & reports","Payments","/payments"},{"Money & reports","Payment approvals","/whatsapp-payment-approval"},{"Money & reports","Generate bills","/billing"},{"Money & reports","View bills","/view-bills"},{"Money & reports","Revenue reports","/dashboard"},{"Money & reports","Bill delivery","/bill-delivery-status"},
          {"Communication","WhatsApp inbox","/whatsapp-inbox"},{"Communication","Announcements","/announcement"},{"Communication","Announcement delivery","/announcement-delivery-status"},{"Communication","Customer login IDs","/customer-login-id-sender"},
          {"Website","Website orders","/website-orders"},{"Website","Website menu","/website-menu"},{"Website","Website reviews","/website-reviews"},{"Website","Website settings","/website-settings"},
          {"Settings","Price settings","/price-settings"},{"Settings","Users","/users"},{"Settings","Tiffin request settings","/customer-modification-settings"},{"Settings","Business information","/business-info"}
        };
        Runnable render=()->{list.removeAllViews();String query=search.getText().toString().trim().toLowerCase(Locale.ROOT);String previous="";int count=0;
            for(String[] item:items){if(!(item[0]+" "+item[1]).toLowerCase(Locale.ROOT).contains(query))continue;count++;
                if(!previous.equals(item[0])){TextView heading=new TextView(this);heading.setText(item[0].toUpperCase(Locale.ROOT));heading.setTextSize(10);heading.setTypeface(null,android.graphics.Typeface.BOLD);heading.setTextColor(MUTED);heading.setPadding(dp(4),dp(22),0,dp(10));list.addView(heading);previous=item[0];}
                TextView button=new TextView(this);button.setText(item[1]);button.setTextSize(15);button.setTextColor(INK);button.setPadding(dp(14),dp(16),dp(14),dp(16));button.setMinHeight(dp(52));button.setBackground(rounded(Color.WHITE,12));button.setClickable(true);button.setFocusable(true);LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2);params.bottomMargin=dp(6);list.addView(button,params);
                button.setOnClickListener(view->{dialog.dismiss();navigate(item[2],item[2].equals("/dashboard")?"reports":"home");});
            }
            if(count==0){TextView empty=new TextView(this);empty.setText("No matching tools. Try another name.");empty.setTextColor(MUTED);empty.setPadding(0,dp(24),0,dp(24));list.addView(empty);}
        };
        search.addTextChangedListener(new android.text.TextWatcher(){public void beforeTextChanged(CharSequence s,int start,int count,int after){}public void onTextChanged(CharSequence s,int start,int before,int count){render.run();}public void afterTextChanged(android.text.Editable text){}});render.run();
        LinearLayout actions=new LinearLayout(this);actions.setPadding(0,dp(14),0,0);panel.addView(actions);
        TextView refresh=new TextView(this);refresh.setText("Refresh page");refresh.setGravity(Gravity.CENTER);refresh.setTextColor(BLUE);refresh.setTextSize(14);refresh.setMinHeight(dp(48));actions.addView(refresh,new LinearLayout.LayoutParams(0,-2,1));refresh.setOnClickListener(view->{dialog.dismiss();guardDrafts(web::reload);});
        TextView logout=new TextView(this);logout.setText("Sign out");logout.setGravity(Gravity.CENTER);logout.setTextColor(0xffa14c3c);logout.setTextSize(14);logout.setMinHeight(dp(48));actions.addView(logout,new LinearLayout.LayoutParams(0,-2,1));logout.setOnClickListener(view->{new AlertDialog.Builder(this).setTitle("Sign out?").setMessage("Leave your admin workspace?").setNegativeButton("Stay",(d,w)->{}).setPositiveButton("Sign out",(d,w)->{dialog.dismiss();guardDrafts(()->web.evaluateJavascript("document.querySelector('button[aria-label=\"Sign out\"]')?.click()",null));}).show();});
        TextView deviceSetting=new TextView(this);deviceSetting.setText(secureSession.enabled()?"Phone unlock is on - Turn off":"Enable fingerprint / phone PIN unlock");deviceSetting.setTextSize(13);deviceSetting.setTextColor(BLUE);deviceSetting.setGravity(Gravity.CENTER);deviceSetting.setMinHeight(dp(48));panel.addView(deviceSetting);deviceSetting.setOnClickListener(view->{dialog.dismiss();if(secureSession.enabled()){secureSession.clear();enrollmentOffered=true;toast("Phone unlock turned off.");}else enableDeviceUnlock();});
        TextView updates=new TextView(this);updates.setText("Check for updates");updates.setTextSize(14);updates.setTextColor(BLUE);updates.setGravity(Gravity.CENTER);updates.setMinHeight(dp(48));panel.addView(updates);updates.setOnClickListener(view->{dialog.dismiss();checkForAppUpdate();});
        dialog.setContentView(panel);android.view.Window window=dialog.getWindow();if(window!=null){window.setBackgroundDrawableResource(android.R.color.transparent);window.setGravity(Gravity.BOTTOM);window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);}dialog.show();if(window!=null)window.setLayout(-1,-2);
    }
    private boolean checkingUpdate=false;
    private void checkForAppUpdate(){
        if(checkingUpdate)return;checkingUpdate=true;toast("Checking for updates...");
        files.execute(()->{
            java.net.HttpURLConnection connection=null;
            try{
                connection=(java.net.HttpURLConnection)new java.net.URL(AdminRoutes.ORIGIN+"/admin-app-release.json").openConnection();
                connection.setConnectTimeout(10000);connection.setReadTimeout(10000);connection.setInstanceFollowRedirects(false);connection.setRequestProperty("Cache-Control","no-cache");
                if(connection.getResponseCode()!=200)throw new java.io.IOException("Update service unavailable");
                java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream();
                try(java.io.InputStream input=connection.getInputStream()){byte[] buffer=new byte[2048];int n;while((n=input.read(buffer))!=-1){if(bytes.size()+n>16384)throw new java.io.IOException("Invalid update metadata");bytes.write(buffer,0,n);}}
                JSONObject release=new JSONObject(bytes.toString("UTF-8"));
                UpdateRelease update=UpdateRelease.parse(release);
                android.content.pm.PackageInfo info=getPackageManager().getPackageInfo(getPackageName(),0);
                long installed=Build.VERSION.SDK_INT>=28?info.getLongVersionCode():info.versionCode;
                runOnUiThread(()->{checkingUpdate=false;if(isFinishing()||isDestroyed()||locked)return;
                    if(update.code<=installed){new AlertDialog.Builder(this).setTitle("App is up to date").setMessage("Installed version: "+info.versionName).setPositiveButton("OK",null).show();return;}
                    new AlertDialog.Builder(this).setTitle("Update available: "+update.version).setMessage(update.notes+"\n\nDownload the APK, then open it to install. Android will ask you to confirm installation.").setNegativeButton("Later",null).setPositiveButton("Download APK",(d,w)->downloadAppUpdate(update)).show();
                });
            }catch(Exception error){runOnUiThread(()->{checkingUpdate=false;if(!isFinishing()&&!isDestroyed()&&!locked)toast("Could not check for updates. Please try again.");});}
            finally{if(connection!=null)connection.disconnect();}
        });
    }
    private void downloadAppUpdate(UpdateRelease update){
        try{
            android.app.DownloadManager manager=(android.app.DownloadManager)getSystemService(DOWNLOAD_SERVICE);
            android.app.DownloadManager.Request request=new android.app.DownloadManager.Request(Uri.parse(update.url));
            request.setTitle("OM Tiffin Admin "+update.version);request.setDescription("App update APK");request.setMimeType("application/vnd.android.package-archive");request.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalFilesDir(this,android.os.Environment.DIRECTORY_DOWNLOADS,"OM-Tiffin-Admin-"+update.code+".apk");manager.enqueue(request);
            toast("Update download started. Open the completed download to install.");
        }catch(Exception error){openExternal(Uri.parse(update.url));}
    }
    private void buildDeviceLock(){
        deviceLock=new LinearLayout(this);deviceLock.setOrientation(LinearLayout.VERTICAL);deviceLock.setGravity(Gravity.CENTER);deviceLock.setPadding(dp(28),dp(28),dp(28),dp(28));deviceLock.setBackgroundColor(0xfff5f6f1);
        TextView brand=new TextView(this);brand.setText("OM TIFFIN");brand.setTextColor(BLUE);brand.setTextSize(14);brand.setTypeface(null,android.graphics.Typeface.BOLD);deviceLock.addView(brand);
        TextView title=new TextView(this);title.setText("Your workspace\nis locked");title.setTextColor(INK);title.setTextSize(30);title.setGravity(Gravity.CENTER);title.setTypeface(null,android.graphics.Typeface.BOLD);title.setPadding(0,dp(24),0,dp(16));deviceLock.addView(title);
        TextView message=new TextView(this);message.setText("Use your phone's fingerprint, PIN, pattern or password to continue.");message.setTextColor(MUTED);message.setTextSize(15);message.setGravity(Gravity.CENTER);message.setPadding(0,0,0,dp(28));deviceLock.addView(message);
        Button unlock=new Button(this);unlock.setText("Unlock with phone");unlock.setTextColor(Color.WHITE);unlock.setBackground(rounded(BLUE,14));unlock.setMinHeight(dp(54));deviceLock.addView(unlock,new LinearLayout.LayoutParams(-1,dp(54)));unlock.setOnClickListener(view->unlockRememberedSession());
        Button password=new Button(this);password.setText("Use user ID & password");password.setTextColor(BLUE);password.setBackgroundColor(Color.TRANSPARENT);password.setMinHeight(dp(54));LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,dp(54));params.topMargin=dp(12);deviceLock.addView(password,params);password.setOnClickListener(view->usePasswordLogin());
        content.addView(deviceLock,new FrameLayout.LayoutParams(-1,-1));deviceLock.setVisibility(View.GONE);
    }
    private void setDeviceLocked(boolean value){if(value&&toolsDialog!=null)toolsDialog.dismiss();locked=value;deviceLock.setVisibility(value?View.VISIBLE:View.GONE);web.setVisibility(value?View.INVISIBLE:View.VISIBLE);updateNavigation();}
    private void observeSession(String token){
        if(token.isEmpty() && pendingRestore!=null)return;
        if(token.isEmpty()){hasWebSession=false;observedToken="";secureSession.clear();enrollmentOffered=false;authenticated=false;updateNavigation();return;}
        if(token.equals(observedToken))return;
        if(secureSession.enabled()&&!observedToken.isEmpty())secureSession.clear();
        observedToken=token;hasWebSession=true;if(authenticated)offerDeviceUnlock();
    }
    private void offerDeviceUnlock(){
        if(enrollmentOffered||secureSession.enabled()||!deviceUnlock.available()||!TokenPolicy.usable(observedToken,System.currentTimeMillis()/1000))return;
        enrollmentOffered=true;
        new AlertDialog.Builder(this).setTitle("Use your phone to unlock?").setMessage("Next time, open OM Tiffin with your fingerprint or phone PIN/password. Your account password is never saved. When your session expires, sign in again.")
            .setNegativeButton("Not now",(d,w)->{}).setPositiveButton("Enable",(d,w)->enableDeviceUnlock()).show();
    }
    private void enableDeviceUnlock(){
        if(!deviceUnlock.available()){toast("Set a phone screen lock first, then enable phone unlock.");return;}
        String token=observedToken;
        if(!TokenPolicy.usable(token,System.currentTimeMillis()/1000)){toast("Please sign in again before enabling phone unlock.");return;}
        deviceUnlock.authenticate(()->{
            if(!token.equals(observedToken)){toast("Your session changed. Please try again.");return;}
            try{secureSession.save(token);enrollmentOffered=true;toast("Phone unlock enabled.");}
            catch(Exception error){secureSession.clear();toast("Phone unlock could not be enabled. Please try your phone PIN.");}
        },()->toast("Phone unlock was not enabled."));
    }
    private void unlockRememberedSession(){
        if(!locked||deviceUnlock.busy())return;
        if(!secureSession.enabled()||!deviceUnlock.available()){usePasswordLogin();return;}
        deviceUnlock.authenticate(()->{
            try{
                String token=secureSession.read();observedToken=token;enrollmentOffered=true;
                if(!hasWebSession||web.getUrl()==null||web.getUrl().equals("about:blank")){
                    restorationGeneration++;pendingRestore=token;
                    if(WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)){
                        if(restoreScript!=null)restoreScript.remove();
                        restoreScript=WebViewCompat.addDocumentStartJavaScript(web,"if(window===window.top){sessionStorage.setItem('token',"+JSONObject.quote(token)+");}",new HashSet<>(Arrays.asList(AdminRoutes.ORIGIN,"https://omtiffinservices.com")));
                        web.loadUrl(AdminRoutes.ORIGIN+"/dashboard");
                    }else web.loadUrl(AdminRoutes.ORIGIN+"/login");
                }
                else web.evaluateJavascript("sessionStorage.getItem('token')",value->{if(JSONObject.quote(token).equals(value)){setDeviceLocked(false);web.evaluateJavascript("window.dispatchEvent(new Event('focus'))",null);}else{toast("Your session ended. Please sign in again.");usePasswordLogin();}});
            }catch(android.security.keystore.UserNotAuthenticatedException error){toast("Phone authentication needs to be repeated. Tap Unlock with phone.");}
            catch(android.security.keystore.KeyPermanentlyInvalidatedException | IllegalArgumentException | IllegalStateException error){toast("Your saved session expired or your screen lock changed. Please sign in again.");usePasswordLogin();}
            catch(Exception error){toast("Phone unlock could not read the saved session. Try again or choose account login.");}
        },()->{if(!isFinishing())toast("Still locked. Try again or use your account password.");});
    }
    private void usePasswordLogin(){restorationGeneration++;
        if(restoreScript!=null){restoreScript.remove();restoreScript=null;}
        secureSession.clear();hasWebSession=false;observedToken="";pendingRestore=null;enrollmentOffered=false;authenticated=false;promptOnResume=false;
        // Keep the lock cover visible until the old WebView session has been removed.
        if(AdminRoutes.trustedOrigin(web.getUrl()))web.evaluateJavascript("sessionStorage.removeItem('token')",result->{setDeviceLocked(false);web.loadUrl(AdminRoutes.ORIGIN+"/login");});
        else{setDeviceLocked(false);web.loadUrl(AdminRoutes.ORIGIN+"/login");}
    }
    private void buildErrorState(){networkError=new LinearLayout(this);networkError.setOrientation(LinearLayout.VERTICAL);networkError.setGravity(Gravity.CENTER);networkError.setPadding(dp(30),dp(30),dp(30),dp(30));networkError.setBackgroundColor(0xfff5f6f1);TextView title=new TextView(this);title.setText("Let's reconnect");title.setTextColor(INK);title.setTextSize(24);title.setTypeface(null,android.graphics.Typeface.BOLD);networkError.addView(title);TextView message=new TextView(this);connectionMessage=message;message.setText("Check your internet connection and try again.");message.setTextColor(MUTED);message.setGravity(Gravity.CENTER);message.setPadding(0,dp(12),0,dp(20));networkError.addView(message);Button retry=new Button(this);retry.setText("Try again");retry.setOnClickListener(view->{networkError.setVisibility(View.GONE);web.stopLoading();if(AdminRoutes.allowed(web.getUrl()))web.reload();else web.loadUrl(AdminRoutes.ORIGIN+"/login");});networkError.addView(retry);networkError.setVisibility(View.GONE);content.addView(networkError,new FrameLayout.LayoutParams(-1,-1));}
    private void savePdf(String name,String data){
        if(pdfBusy){toast("Finish saving the current PDF first.");return;}if(data.length()>24*1024*1024){toast("This PDF is too large.");return;}pdfBusy=true;
        files.execute(()->{try{byte[] bytes=Base64.decode(data,Base64.DEFAULT);if(bytes.length<5||!new String(bytes,0,5,StandardCharsets.US_ASCII).equals("%PDF-"))throw new IllegalArgumentException();runOnUiThread(()->{pendingPdf=bytes;String filename=name.replaceAll("[\\\\/:*?\"<>|]","_");if(!filename.toLowerCase(Locale.ROOT).endsWith(".pdf"))filename+=".pdf";Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("application/pdf");intent.putExtra(Intent.EXTRA_TITLE,filename.substring(0,Math.min(filename.length(),120)));try{startActivityForResult(intent,13);}catch(Exception error){pendingPdf=null;pdfBusy=false;toast("No document saver is available.");}});}catch(Exception error){runOnUiThread(()->{pdfBusy=false;toast("Only valid PDF receipts and bills can be saved.");});}});
    }
    private void openExternal(Uri uri){String scheme=uri.getScheme();if(!Arrays.asList("https","tel","mailto","whatsapp").contains(scheme)){toast("This link cannot be opened in the admin app.");return;}try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){toast("No app can open this link.");}}
    private void back(){if(locked){finish();return;}guardDrafts(()->{if(currentPath.equals("/dashboard")||currentPath.equals("/login"))finish();else if(web.canGoBack())web.goBack();else finish();});}
    @Override public void onBackPressed(){back();}
    @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] results){super.onRequestPermissionsResult(request,permissions,results);if(request==11&&cameraRequest!=null){if(results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED)cameraRequest.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});else cameraRequest.deny();cameraRequest=null;}}
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(deviceUnlock.result(request,result))return;if(request==12&&fileChooser!=null){fileChooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileChooser=null;}if(request==13){byte[] bytes=pendingPdf;pendingPdf=null;pdfBusy=false;if(result==RESULT_OK&&data!=null&&data.getData()!=null&&bytes!=null){Uri target=data.getData();files.execute(()->{try(OutputStream stream=getContentResolver().openOutputStream(target)){if(stream==null)throw new IllegalStateException();stream.write(bytes);runOnUiThread(()->toast("PDF saved successfully."));}catch(Exception error){runOnUiThread(()->toast("PDF could not be saved. Please retry."));}});}}}
    @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);}
    @Override protected void onResume(){super.onResume();if(web!=null){web.onResume();if(!locked)web.evaluateJavascript("window.dispatchEvent(new Event('focus'))",null);if(locked&&promptOnResume){promptOnResume=false;web.post(this::unlockRememberedSession);}}}
    @Override protected void onStop(){
        if(secureSession!=null&&secureSession.enabled()&&!deviceUnlock.busy()&&fileChooser==null&&pendingPdf==null){restorationGeneration++;if(restoreScript!=null){restoreScript.remove();restoreScript=null;}if(pendingRestore!=null)web.stopLoading();pendingRestore=null;setDeviceLocked(true);promptOnResume=true;}
        super.onStop();
    }
    @Override protected void onPause(){if(web!=null)web.onPause();super.onPause();}
    @Override protected void onDestroy(){if(restoreScript!=null)restoreScript.remove();startupHandler.removeCallbacks(startupTimeout);deviceUnlock.destroy();observedToken="";pendingRestore=null;if(fileChooser!=null)fileChooser.onReceiveValue(null);if(cameraRequest!=null)cameraRequest.deny();pendingPdf=null;web.destroy();files.shutdown();super.onDestroy();}
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
