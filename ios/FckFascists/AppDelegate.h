#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import <Expo/Expo.h>

@interface AppDelegate : EXAppDelegateWrapper

// Creates the React Native root view inside the given window scene.
// Called by SceneDelegate; the app uses the UIScene life cycle, which
// apps built with the iOS 27 SDK require (Apple TN3187).
- (void)loadReactNativeWindowInScene:(UIWindowScene *)windowScene
                       launchOptions:(NSDictionary *)launchOptions;

@end

@interface SceneDelegate : UIResponder <UIWindowSceneDelegate>

@property (nonatomic, strong) UIWindow *window;

@end
