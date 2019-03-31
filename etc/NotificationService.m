//
//  NotificationService.m
//  NotificationService
//
//  Created by User on 29/09/16.
//
//
// Credit https://github.com/Leanplum/Leanplum-iOS-Samples/blob/master/iOS_basicSetup/basicSetup/richPushExtension/NotificationService.m

#import "NotificationService.h"

@interface NotificationService ()

@property (nonatomic, strong) void (^contentHandler)(UNNotificationContent *contentToDeliver);
@property (nonatomic, strong) UNMutableNotificationContent *bestAttemptContent;

@end

@implementation NotificationService


- (void)didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent * _Nonnull))contentHandler {
    self.contentHandler = contentHandler;
    self.bestAttemptContent = [request.content mutableCopy];
    NSDictionary *userInfo = request.content.userInfo;
    
    
    // If there is no image in the payload than
    // the code will still show the push notification.
    if (userInfo == nil || userInfo[@"image_url_jpg"] == nil) {
        self.contentHandler(self.bestAttemptContent);
        return;
    }
    
    NSString *attachmentMedia = userInfo[@"image_url_jpg"];
    //NSLog (@"Your attachment URL is: %@", attachmentMedia);
    
    // If there is an image in the payload, this part
    // will handle the downloading and displaying of the image.
    if (attachmentMedia) {
        NSURL *URL = [NSURL URLWithString:attachmentMedia];
        NSURLSession *LPSession = [NSURLSession sessionWithConfiguration:
                                   [NSURLSessionConfiguration defaultSessionConfiguration]];
        [[LPSession downloadTaskWithURL:URL completionHandler: ^(NSURL *temporaryLocation, NSURLResponse *response, NSError *error) {
            if (error) {
                NSLog(@"zmNinja Push: Error with downloading rich push: %@",
                      [error localizedDescription]);
                self.contentHandler(self.bestAttemptContent);
                return;
            }
            
            NSString *fileType = [self determineType: [response MIMEType]];
            NSString *fileName = [[temporaryLocation.path lastPathComponent] stringByAppendingString:fileType];
            NSString *temporaryDirectory = [NSTemporaryDirectory() stringByAppendingPathComponent:fileName];
            [[NSFileManager defaultManager] moveItemAtPath:temporaryLocation.path toPath:temporaryDirectory error:&error];
            
            NSError *attachmentError = nil;
            UNNotificationAttachment *attachment =
            [UNNotificationAttachment attachmentWithIdentifier:@""
                                                           URL:[NSURL fileURLWithPath:temporaryDirectory]
                                                       options:nil
                                                         error:&attachmentError];
            if (attachmentError != NULL) {
                NSLog(@"zmNinja push: Error with the rich push attachment: %@",
                      [attachmentError localizedDescription]);
                self.contentHandler(self.bestAttemptContent);
                return;
            }
            self.bestAttemptContent.attachments = @[attachment];
            self.contentHandler(self.bestAttemptContent);
            [[NSFileManager defaultManager] removeItemAtPath:temporaryDirectory error:&error];
        }] resume];
    }
    
}

- (NSString*)determineType:(NSString *) fileType {
    // Determines the file type of the attachment to append to NSURL.
   
        return @".jpg";
   
    
}

- (void)serviceExtensionTimeWillExpire {
    // Called just before the extension will be terminated by the system.
    // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
    self.contentHandler(self.bestAttemptContent);
}

@end

