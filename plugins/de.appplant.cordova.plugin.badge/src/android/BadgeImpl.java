/*
 * Copyright (c) 2014-2015 by appPlant UG. All rights reserved.
 *
 * @APPPLANT_LICENSE_HEADER_START@
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 *
 * @APPPLANT_LICENSE_HEADER_END@
 */

package de.appplant.cordova.plugin.badge;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;

import me.leolin.shortcutbadger.ShortcutBadger;
import me.leolin.shortcutbadger.impl.DefaultBadger;

/**
 * Implementation of the badge interface methods.
 */
class BadgeImpl {

    /**
     * The ID for the notification
     */
    private final int ID = -450793490;

    /**
     * The name for the shared preferences key
     */
    protected static final String KEY = "badge";

    /**
     * Bundle identifier for the autoCancel value
     */
    protected static final String EXTRA_AUTO_CANCEL = "EXTRA_AUTO_CANCEL";

    /**
     * Finds out if badgeing the app icon is possible on that device.
     *
     * @param ctx
     * The application context.
     * @return
     * true if its supported.
     */
    private boolean canBadgeAppIcon (Context ctx) {
        ShortcutBadger badger = ShortcutBadger.with(ctx);

        return !(badger instanceof DefaultBadger);
    }

    /**
     * Clears the badge of the app icon.
     *
     * @param ctx
     * The application context.
     */
    protected void clearBadge (Context ctx) {
        saveBadge(0, ctx);
        getNotificationManager(ctx).cancel(ID);
        ShortcutBadger.with(ctx).remove();
    }

    /**
     * Retrieves the badge of the app icon.
     *
     * @param ctx
     * The application context.
     * @param callback
     * The function to be exec as the callback.
     */
    protected void getBadge (CallbackContext callback, Context ctx) {
        SharedPreferences settings = getSharedPreferences(ctx);
        int badge = settings.getInt(KEY, 0);
        PluginResult result;

        result = new PluginResult(PluginResult.Status.OK, badge);

        callback.sendPluginResult(result);
    }

    /**
     * Sets the badge of the app icon.
     *
     * @param args
     * The new badge number
     * @param ctx
     * The application context
     */
    protected void setBadge (JSONArray args, Context ctx) {
        int badge = args.optInt(0);

        saveBadge(badge, ctx);

        if (canBadgeAppIcon(ctx)) {
            ShortcutBadger.with(ctx).count(badge);
        } else {
            setBadgeNotification(badge, args, ctx);
        }
    }

    /**
     * Sets the badge of the app icon.
     *
     * @param args
     * The new badge number
     * @param ctx
     * The application context
     */
    @SuppressWarnings("deprecation")
    private void setBadgeNotification (int badge, JSONArray args, Context ctx) {
        String title       = args.optString(1, "%d new messages");
        String icon        = args.optString(2);
        boolean autoCancel = args.optBoolean(3, false);

        Resources res   = ctx.getResources();
        Bitmap appIcon  = BitmapFactory.decodeResource(
                res, getDrawableIcon(ctx));

        Intent intent = new Intent(ctx, LaunchActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);

        intent.putExtra(EXTRA_AUTO_CANCEL, autoCancel);

        PendingIntent contentIntent = PendingIntent.getActivity(
                ctx, ID, intent, PendingIntent.FLAG_CANCEL_CURRENT);

        String title_ = String.format(title, badge);

        Notification.Builder notification = new Notification.Builder(ctx)
                .setContentTitle(title_)
                .setNumber(badge)
                .setTicker(title_)
                .setAutoCancel(autoCancel)
                .setSmallIcon(getResIdForSmallIcon(icon, ctx))
                .setLargeIcon(appIcon)
                .setContentIntent(contentIntent);

        if (Build.VERSION.SDK_INT<16) {
            // Build notification for HoneyComb to ICS
            getNotificationManager(ctx).notify(ID, notification.getNotification());
        } else if (Build.VERSION.SDK_INT>15) {
            // Notification for Jellybean and above
            getNotificationManager(ctx).notify(ID, notification.build());
        }
    }

    /**
     * Persist the badge of the app icon so that `getBadge` is able to return
     * the badge number back to the client.
     *
     * @param badge
     * The badge of the app icon.
     * @param ctx
     * The application context.
     */
    protected void saveBadge (int badge, Context ctx) {
        SharedPreferences.Editor editor = getSharedPreferences(ctx).edit();

        editor.putInt(KEY, badge);
        editor.apply();
    }

    /**
     * Informs if the app has the permission to show badges.
     *
     * @param callback
     * The function to be exec as the callback
     */
    protected void hasPermission (final CallbackContext callback) {
        PluginResult result = new PluginResult(PluginResult.Status.OK, true);

        callback.sendPluginResult(result);
    }

    /**
     * The Local storage for the application.
     */
    private SharedPreferences getSharedPreferences (Context context) {
        return context.getSharedPreferences(KEY, Context.MODE_PRIVATE);
    }

    /**
     * The NotificationManager for the app.
     */
    private NotificationManager getNotificationManager (Context context) {
        return (NotificationManager) context.getSystemService(
                Context.NOTIFICATION_SERVICE);
    }

    /**
     * Returns the ID for the given resource.
     *
     * @return
     * The resource ID of the app icon
     */
    private int getDrawableIcon (Context ctx) {
        Resources res   = ctx.getResources();
        String pkgName  = ctx.getPackageName();

        int resId;
        resId = res.getIdentifier("icon", "drawable", pkgName);

        return resId;
    }

    /**
     * Returns the ID for the given resource.
     *
     * @return
     * The resource ID for the small icon.
     */
    private int getResIdForSmallIcon (String smallIcon, Context ctx) {
        int resId;

        String pkgName = ctx.getPackageName();

        resId = getResId(pkgName, smallIcon);

        if (resId == 0) {
            resId = getResId("android", smallIcon);
        }

        if (resId == 0) {
            resId = getResId("android", "ic_dialog_email");
        }

        return resId;
    }

    /**
     * Returns numerical icon Value.
     *
     * @param className
     * The class name prefix either from Android or the app.
     * @param iconName
     * The resource name.
     */
    private int getResId (String className, String iconName) {
        int icon = 0;

        try {
            Class<?> klass  = Class.forName(className + ".R$drawable");

            icon = (Integer) klass.getDeclaredField(iconName).get(Integer.class);
        } catch (Exception ignored) {}

        return icon;
    }

}
