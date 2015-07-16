package org.devgeeks.Canvas2ImagePlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Calendar;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;

import org.json.JSONArray;
import org.json.JSONException;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.util.Base64;
import android.util.Log;

/**
 * Canvas2ImagePlugin.java
 *
 * Android implementation of the Canvas2ImagePlugin for iOS.
 * Inspirated by Joseph's "Save HTML5 Canvas Image to Gallery" plugin
 * http://jbkflex.wordpress.com/2013/06/19/save-html5-canvas-image-to-gallery-phonegap-android-plugin/
 *
 * @author Vegard Løkken <vegard@headspin.no>
 */
public class Canvas2ImagePlugin extends CordovaPlugin {
	public static final String ACTION = "saveImageDataToLibrary";

	@Override
	public boolean execute(String action, JSONArray data,
			CallbackContext callbackContext) throws JSONException {

		if (action.equals(ACTION)) {

			String base64 = data.optString(0);
			if (base64.equals("")) // isEmpty() requires API level 9
				callbackContext.error("Missing base64 string");

			// Create the bitmap from the base64 string
			Log.d("Canvas2ImagePlugin", base64);
			byte[] decodedString = Base64.decode(base64, Base64.DEFAULT);
			Bitmap bmp = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
			if (bmp == null) {
				callbackContext.error("The image could not be decoded");
			} else {

				// Save the image
				File imageFile = savePhoto(bmp);
				if (imageFile == null)
					callbackContext.error("Error while saving image");

				// Update image gallery
				scanPhoto(imageFile);

				callbackContext.success(imageFile.toString());
			}

			return true;
		} else {
			return false;
		}
	}

	private File savePhoto(Bitmap bmp) {
		File retVal = null;

		try {
			Calendar c = Calendar.getInstance();
			String date = "" + c.get(Calendar.DAY_OF_MONTH)
					+ c.get(Calendar.MONTH)
					+ c.get(Calendar.YEAR)
					+ c.get(Calendar.HOUR_OF_DAY)
					+ c.get(Calendar.MINUTE)
					+ c.get(Calendar.SECOND);

			String deviceVersion = Build.VERSION.RELEASE;
			Log.i("Canvas2ImagePlugin", "Android version " + deviceVersion);
			int check = deviceVersion.compareTo("2.3.3");

			File folder;
			/*
			 * File path = Environment.getExternalStoragePublicDirectory(
			 * Environment.DIRECTORY_PICTURES ); //this throws error in Android
			 * 2.2
			 */
			if (check >= 1) {
				folder = Environment
					.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);

				if(!folder.exists()) {
					folder.mkdirs();
				}
			} else {
				folder = Environment.getExternalStorageDirectory();
			}

			File imageFile = new File(folder, "c2i_" + date.toString() + ".png");

			FileOutputStream out = new FileOutputStream(imageFile);
			bmp.compress(Bitmap.CompressFormat.PNG, 100, out);
			out.flush();
			out.close();

			retVal = imageFile;
		} catch (Exception e) {
			Log.e("Canvas2ImagePlugin", "An exception occured while saving image: "
					+ e.toString());
		}
		return retVal;
	}

	/* Invoke the system's media scanner to add your photo to the Media Provider's database,
	 * making it available in the Android Gallery application and to other apps. */
	private void scanPhoto(File imageFile)
	{
		Intent mediaScanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
	    Uri contentUri = Uri.fromFile(imageFile);
	    mediaScanIntent.setData(contentUri);
	    cordova.getActivity().sendBroadcast(mediaScanIntent);
	}
}
