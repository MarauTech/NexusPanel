package com.marautch.nexuspanel;

import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setAllowFileAccess(true);
                settings.setAllowContentAccess(true);

                webView.addJavascriptInterface(new Object() {
                    @JavascriptInterface
                    public void syncServerUrl(String serverUrl) {
                        WidgetUpdateHelper.setServerUrl(MainActivity.this, serverUrl);
                        WidgetUpdateHelper.updateAllWidgets(MainActivity.this);
                    }

                    @JavascriptInterface
                    public void syncWidgetData(String widgetType, String jsonPayload) {
                        WidgetUpdateHelper.setCachedJson(MainActivity.this, widgetType, jsonPayload);
                        WidgetUpdateHelper.updateAllWidgets(MainActivity.this);
                    }
                }, "AndroidWidgetBridge");
            }
        } catch (Exception ignored) {}
    }
}
