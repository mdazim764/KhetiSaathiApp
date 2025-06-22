package com.cropcalendarapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equals("android.intent.action.BOOT_COMPLETED") ||
            intent.getAction().equals("android.intent.action.QUICKBOOT_POWERON") ||
            intent.getAction().equals("com.htc.intent.action.QUICKBOOT_POWERON")) {
            
            Log.d("CropCalendarApp", "Boot completed, starting main app");
            
            // Start the main app
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage("com.cropcalendarapp");
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(launchIntent);
            }
        }
    }
}