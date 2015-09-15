//
//  CDVPinDialog.h
//  HelloWorld
//
//
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <Cordova/CDVPlugin.h>


@interface CDVPinDialog : CDVPlugin <UIAlertViewDelegate>{}
@property (nonatomic, copy) NSString* callbackId;
    
- (void)prompt:(CDVInvokedUrlCommand*)command;
    
@end

