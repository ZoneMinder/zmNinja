//
//  CDVPinDialog.m
//  HelloWorld
//
//
//

#import "CDVPinDialog.h"

@implementation CDVPinDialog
    
- (void)prompt:(CDVInvokedUrlCommand*)command
{
    self.callbackId = command.callbackId;
    NSString* message = [command argumentAtIndex:0];
    NSString* title = [command argumentAtIndex:1];
    NSArray* buttons = [command argumentAtIndex:2];
    
    UIAlertView* alertView = [[UIAlertView alloc]
                               initWithTitle:title
                               message:message
                               delegate:self
                               cancelButtonTitle:nil
                               otherButtonTitles:nil];
    
    //alertView.callbackId = callbackId;
    
    int count = [buttons count];
    
    for (int n = 0; n < count; n++) {
        [alertView addButtonWithTitle:[buttons objectAtIndex:n]];
    }
    
    alertView.alertViewStyle = UIAlertViewStyleSecureTextInput;
    UITextField* textField = [alertView textFieldAtIndex:0];
    
    [alertView show];

    [textField resignFirstResponder];
    [textField setKeyboardType:UIKeyboardTypeNumberPad];
    [textField becomeFirstResponder];
    
}
    
    
- (void)alertView:(UIAlertView*)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
    CDVPluginResult* result;

    NSString* value0 = [[alertView textFieldAtIndex:0] text];
    NSDictionary* info = @{
                           @"buttonIndex":@(buttonIndex + 1),
                           @"input1":(value0 ? value0 : [NSNull null])
                           };
    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:info];

    [self.commandDelegate sendPluginResult:result callbackId:self.callbackId];
}
    

@end
