package com.omtiffin.admin;
import java.net.URI;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
public final class AdminRoutes {
 public static final String ORIGIN="https://www.omtiffinservices.com";
 private static final Set<String> ROUTES=new HashSet<>(Arrays.asList("/login","/admin","/dashboard","/customers","/users","/add-customer","/daily-entry","/meal-deliveries","/barcode-entry","/price-settings","/billing","/payments","/customer-login-id-sender","/announcement","/whatsapp-inbox","/whatsapp-payment-approval","/bill-delivery-status","/announcement-delivery-status","/view-bills","/website-menu","/website-orders","/website-settings","/website-reviews","/customer-modification-requests","/customer-modification-settings","/business-info"));
 public static boolean trustedOrigin(String url) {
  try { URI uri=new URI(url);return "https".equals(uri.getScheme()) && ("omtiffinservices.com".equalsIgnoreCase(uri.getHost()) || "www.omtiffinservices.com".equalsIgnoreCase(uri.getHost())) && uri.getUserInfo()==null && (uri.getPort()==-1 || uri.getPort()==443); } catch(Exception ignored){return false;}
 }
 public static boolean allowed(String url) {
  if(!trustedOrigin(url))return false;
  try{String path=new URI(url).getPath();return ROUTES.contains(path) || path.matches("/(customer|edit-customer|view-bills|payment-receipt)/[a-fA-F0-9]{24}");}catch(Exception ignored){return false;}
 }
 public static String tab(String path){if(path.startsWith("/customer/")||path.equals("/customers")||path.startsWith("/edit-customer"))return "Customers";if(path.equals("/barcode-entry")||path.equals("/daily-entry"))return "Scan";if(path.equals("/billing")||path.startsWith("/view-bills"))return "Billing";return path.equals("/dashboard")?"Home":"More";}
 private AdminRoutes(){}
}
