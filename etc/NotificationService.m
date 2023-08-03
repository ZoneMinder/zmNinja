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
        NSLog(@"zmNinja Notification: Did not get a payload or image");
        [self contentComplete];
        return;
    }
    
    NSString *mediaUrl = userInfo[@"image_url_jpg"];
   // if (mediaType == nil) {
   //   NSLog(@"zmNinja Notification: No media type specified, assuming .jpg");
  //    mediaType = @".jpg";
  //  }
    
    // load the attachment
    [self loadAttachmentForUrlString:mediaUrl
                            
                   completionHandler:^(UNNotificationAttachment *attachment) {
                       if (attachment) {
                           self.bestAttemptContent.attachments = [NSArray arrayWithObject:attachment];
                       }
                       [self contentComplete];
                   }];
    
}

- (NSString*)determineType:(NSString *) fileType {
    // Determines the file type of the attachment to append to NSURL.
    //return @".gif";
      // Determines the file type of the attachment to append to NSURL.
    NSLog (@"zmNinja Notification: determineType got filetype=%@",fileType);
    if ([fileType isEqualToString:@"image/jpeg"]){
        NSLog (@"zmNinja Notification: returning JPG");
        return @".jpg";
    }
    if ([fileType isEqualToString:@"video/mp4"]){
        NSLog (@"zmNinja Notification: returning MP4");
        return @".mp4";
    }

    if ([fileType isEqualToString:@"image/gif"]) {
         NSLog (@"zmNinja Notification: returning GIF");
        return @".gif";
    }
    if ([fileType isEqualToString:@"image/png"]) {
         NSLog (@"zmNinja Notification: returning PNG");
        return @".png";
   
    }
     NSLog (@"zmNinja Notification: unrecognized filetype, returning JPG");
    return @".jpg";
   
    
}

- (void)loadAttachmentForUrlString:(NSString *)urlString 
                 completionHandler:(void(^)(UNNotificationAttachment *))completionHandler  {
    
    __block UNNotificationAttachment *attachment = nil;
    NSURL *attachmentURL = [NSURL URLWithString:urlString];
    
    NSURLSession *session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration]];
    [[session downloadTaskWithURL:attachmentURL
                completionHandler:^(NSURL *temporaryFileLocation, NSURLResponse *response, NSError *error) {
                    if (error != nil) {
                     
                        NSLog(@"unable to add attachment: %@", error.localizedDescription);
          
                    } else {
                        NSString *fileType = [self determineType: [response MIMEType]];
                        NSFileManager *fileManager = [NSFileManager defaultManager];
                        NSURL *localURL = [NSURL fileURLWithPath:[temporaryFileLocation.path stringByAppendingString:fileType]];
                        [fileManager moveItemAtURL:temporaryFileLocation toURL:localURL error:&error];
                        
                        NSError *attachmentError = nil;
                        attachment = [UNNotificationAttachment attachmentWithIdentifier:@"" URL:localURL options:nil error:&attachmentError];
                        if (attachmentError) {
                      
                            NSLog(@"unable to add attachment: %@", attachmentError.localizedDescription);
                        
                        }
                    }
                    completionHandler(attachment);
                }] resume];
}

- (void)contentComplete {
    self.contentHandler(self.bestAttemptContent);
}

- (void)serviceExtensionTimeWillExpire {
    // Called just before the extension will be terminated by the system.
    // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
    NSLog (@"zmNinja Notification: Time about to expire, handing off to best attempt");
    self.contentHandler(self.bestAttemptContent);
}

@end

