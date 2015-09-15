package hu.dpal.phonegap.plugins;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.AlertDialog;
import android.app.ProgressDialog;
import android.content.DialogInterface;
import android.text.InputType;
import android.text.method.PasswordTransformationMethod;
import android.widget.EditText;


public class PinDialog extends CordovaPlugin {

    public ProgressDialog spinnerDialog = null;

    public PinDialog() {
    }

    public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
        if (action.equals("prompt")) {
        	
        	final String message = args.getString(0);
        	final String title = args.getString(1);
        	final JSONArray buttonLabels = args.getJSONArray(2);
        	
        	final CordovaInterface cordova = this.cordova;
            final EditText promptInput =  new EditText(cordova.getActivity());
            promptInput.setInputType(InputType.TYPE_CLASS_NUMBER);
            promptInput.setTransformationMethod(PasswordTransformationMethod.getInstance());
           
            Runnable runnable = new Runnable() {
                public void run() {
                    AlertDialog.Builder dlg = new AlertDialog.Builder(cordova.getActivity());
                    dlg.setMessage(message);
                    dlg.setTitle(title);
                    dlg.setCancelable(true);
                    
                    dlg.setView(promptInput);
                    
                    final JSONObject result = new JSONObject();
                    
                    // First button
                    if (buttonLabels.length() > 0) {
                        try {
                            dlg.setNegativeButton(buttonLabels.getString(0),
                                new AlertDialog.OnClickListener() {
                                    public void onClick(DialogInterface dialog, int which) {
                                        dialog.dismiss();
                                        try {
                                            result.put("buttonIndex",1);
                                            result.put("input1", promptInput.getText().toString().trim().length()==0 ? "" : promptInput.getText());                                                                                        
                                        } catch (JSONException e) { e.printStackTrace(); }
                                        callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, result));
                                    }
                                });
                        } catch (JSONException e) { }
                    }

                    // Second button
                    if (buttonLabels.length() > 1) {
                        try {
                            dlg.setNeutralButton(buttonLabels.getString(1),
                                new AlertDialog.OnClickListener() {
                                    public void onClick(DialogInterface dialog, int which) {
                                        dialog.dismiss();
                                        try {
                                            result.put("buttonIndex",2);
                                            result.put("input1", promptInput.getText().toString().trim().length()==0 ? "" : promptInput.getText());
                                        } catch (JSONException e) { e.printStackTrace(); }
                                        callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, result));
                                    }
                                });
                        } catch (JSONException e) { }
                    }

                    // Third button
                    if (buttonLabels.length() > 2) {
                        try {
                            dlg.setPositiveButton(buttonLabels.getString(2),
                                new AlertDialog.OnClickListener() {
                                    public void onClick(DialogInterface dialog, int which) {
                                        dialog.dismiss();
                                        try {
                                            result.put("buttonIndex",3);
                                            result.put("input1", promptInput.getText().toString().trim().length()==0 ? "" : promptInput.getText());
                                        } catch (JSONException e) { e.printStackTrace(); }
                                        callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, result));
                                    }
                                });
                        } catch (JSONException e) { }
                    }
                    
                    dlg.setOnCancelListener(new AlertDialog.OnCancelListener() {
                        public void onCancel(DialogInterface dialog){
                            dialog.dismiss();
                            try {
                                result.put("buttonIndex",0);
                                result.put("input1", promptInput.getText().toString().trim().length()==0 ? "" : promptInput.getText());
                            } catch (JSONException e) { e.printStackTrace(); }
                            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, result));
                        }
                    });

                    dlg.create();
                    dlg.show();

                };
            };
            this.cordova.getActivity().runOnUiThread(runnable);
        	
        	
        }

        return true;
    }

}