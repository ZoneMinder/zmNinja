#import <Cordova/CDVPlugin.h>

@interface LongPressFix : CDVPlugin

@property (nonatomic,strong) UILongPressGestureRecognizer *lpgr;

@end