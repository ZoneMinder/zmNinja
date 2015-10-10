/*
 * Copyright (c) 2013-2015 by appPlant UG. All rights reserved.
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

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;

public class LaunchActivity extends Activity {

    /**
     * Clears the badge and moves the launch intent
     * (web view) back to front.
     */
    @Override
    public void onCreate (Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent  = getIntent();
        boolean cancel = intent.getBooleanExtra(
                BadgeImpl.EXTRA_AUTO_CANCEL, false);

        if (cancel) {
            clearBagde();
        }

        launchMainIntent();
    }

    /**
     * Launch main intent for package.
     */
    private void launchMainIntent () {
        Context context = getApplicationContext();
        String pkgName  = context.getPackageName();
        Intent intent   = context.getPackageManager()
                .getLaunchIntentForPackage(pkgName);

        intent.addFlags(
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        context.startActivity(intent);
    }

    /**
     * Removes the badge of the app icon so that `getBadge`
     * will return 0 back to the client.
     */
    private void clearBagde () {
        SharedPreferences.Editor editor = getSharedPreferences().edit();

        editor.putInt(BadgeImpl.KEY, 0);
        editor.apply();
    }

    /**
     * The Local storage for the application.
     */
    private SharedPreferences getSharedPreferences () {
        Context context = getApplicationContext();

        return context.getSharedPreferences(BadgeImpl.KEY, Context.MODE_PRIVATE);
    }

}
