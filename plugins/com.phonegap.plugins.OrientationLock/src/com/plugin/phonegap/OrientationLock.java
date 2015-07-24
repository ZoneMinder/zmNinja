package com.plugin.phonegap;

import org.json.JSONArray;
import org.json.JSONException;

import android.content.pm.ActivityInfo;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;

/**
 *
 * Android Phonegap Plugin for locking/unlocking the orientation from JS code
 *
 */
public class OrientationLock extends CordovaPlugin {

	private static final String LANSCAPE = "landscape";
	private static final String PORTRAIT = "portrait";

	public OrientationLock() {
	}

	public void unlock() {
		this.cordova.getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
	}

	public void lock(String orientation) {
		if (orientation.equals(PORTRAIT))
			this.cordova.getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
		else
			this.cordova.getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
	}

	@Override
	public boolean execute(String action, JSONArray arguments, CallbackContext callbackContext) {
		if (action.equals("lock")) {

			try {
				String orientation = arguments.getString(0);

				if (orientation!=null && (orientation.equals(LANSCAPE) ||  orientation.equals(PORTRAIT))) {
					this.lock(orientation);
					callbackContext.success();
					return true;
				} else {
					return false;
				}
			} catch (JSONException e) {
				callbackContext.error("JSON_EXCEPTION");
				return true;
			}

		} else if (action.equals("unlock")) {
			this.unlock();
			callbackContext.success();
			return true;

		} else {
			return false;
		}
	}
}
