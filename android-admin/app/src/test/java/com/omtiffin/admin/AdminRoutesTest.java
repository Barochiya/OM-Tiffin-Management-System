package com.omtiffin.admin;
import org.junit.Test;
import static org.junit.Assert.*;
public class AdminRoutesTest {
 @Test public void adminRoutesUseOnlyTheExistingLiveOrigin(){assertTrue(AdminRoutes.allowed(AdminRoutes.ORIGIN+"/dashboard"));assertTrue(AdminRoutes.allowed(AdminRoutes.ORIGIN+"/customer/507f1f77bcf86cd799439011"));assertTrue(AdminRoutes.allowed(AdminRoutes.ORIGIN+"/view-bills/507f1f77bcf86cd799439011?print=true"));assertTrue(AdminRoutes.allowed("https://www.omtiffinservices.com/login"));}
 @Test public void publicCustomerAndUntrustedRoutesAreBlocked(){for(String url:new String[]{"http://omtiffinservices.com/dashboard","https://omtiffinservices.com.evil.test/dashboard","https://evil.test/dashboard","file:///dashboard","javascript:alert(1)",AdminRoutes.ORIGIN+"/customer/dashboard",AdminRoutes.ORIGIN+"/customer-login",AdminRoutes.ORIGIN+"/",AdminRoutes.ORIGIN+"/plans","https://omtiffinservices.com:9999/dashboard","https://user:pass@omtiffinservices.com/dashboard"})assertFalse(url,AdminRoutes.allowed(url));}
 @Test public void detailPagesKeepTheirDailyNavigationSelection(){assertEquals("Customers",AdminRoutes.tab("/customer/507f1f77bcf86cd799439011"));assertEquals("Scan",AdminRoutes.tab("/daily-entry"));assertEquals("Billing",AdminRoutes.tab("/view-bills/507f1f77bcf86cd799439011"));assertEquals("Home",AdminRoutes.tab("/dashboard"));}
}
