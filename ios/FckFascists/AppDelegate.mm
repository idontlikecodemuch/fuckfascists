#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTConstants.h>

@implementation AppDelegate {
  NSDictionary *_launchOptions;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"main";

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // UIScene life cycle: the window is created per scene in SceneDelegate,
  // not here. Apps built with the iOS 27 SDK fail to launch without it
  // (Apple TN3187). Keep the launch options for the root view.
  self.automaticallyLoadReactNativeWindow = NO;
  _launchOptions = launchOptions;

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (void)loadReactNativeWindowInScene:(UIWindowScene *)windowScene
                       launchOptions:(NSDictionary *)launchOptions
{
  // Mirrors RCTAppDelegate's loadReactNativeWindow:, but attaches the
  // window to the scene instead of the main screen.
  NSMutableDictionary *options = [NSMutableDictionary dictionaryWithDictionary:_launchOptions ?: @{}];
  [options addEntriesFromDictionary:launchOptions ?: @{}];
  UIView *rootView = [self.rootViewFactory viewWithModuleName:self.moduleName
                                            initialProperties:self.initialProps
                                                launchOptions:options];
  UIWindow *window = [[UIWindow alloc] initWithWindowScene:windowScene];
  UIViewController *rootViewController = [self createRootViewController];
  [self setRootView:rootView toRootViewController:rootViewController];
  window.rootViewController = rootViewController;
  self.window = window;
  [window makeKeyAndVisible];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  BOOL result = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || result;
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  return [super application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  return [super application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  return [super application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

@end

@implementation SceneDelegate

- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions
{
  if (![scene isKindOfClass:[UIWindowScene class]]) {
    return;
  }
  AppDelegate *appDelegate = (AppDelegate *)[UIApplication sharedApplication].delegate;

  // With scenes, a launch URL arrives in the connection options rather than
  // in application:didFinishLaunchingWithOptions:.
  NSMutableDictionary *launchOptions = [NSMutableDictionary new];
  UIOpenURLContext *urlContext = connectionOptions.URLContexts.anyObject;
  if (urlContext != nil) {
    launchOptions[UIApplicationLaunchOptionsURLKey] = urlContext.URL;
  }

  [appDelegate loadReactNativeWindowInScene:(UIWindowScene *)scene launchOptions:launchOptions];
  self.window = appDelegate.window;

  NSUserActivity *userActivity = connectionOptions.userActivities.anyObject;
  if (userActivity != nil) {
    [self scene:scene continueUserActivity:userActivity];
  }
}

// Linking API: forward to the app delegate so Expo and RCTLinkingManager see it.
- (void)scene:(UIScene *)scene openURLContexts:(NSSet<UIOpenURLContext *> *)URLContexts
{
  AppDelegate *appDelegate = (AppDelegate *)[UIApplication sharedApplication].delegate;
  for (UIOpenURLContext *context in URLContexts) {
    [appDelegate application:[UIApplication sharedApplication] openURL:context.URL options:@{}];
  }
}

// Universal Links
- (void)scene:(UIScene *)scene continueUserActivity:(NSUserActivity *)userActivity
{
  AppDelegate *appDelegate = (AppDelegate *)[UIApplication sharedApplication].delegate;
  [appDelegate application:[UIApplication sharedApplication]
      continueUserActivity:userActivity
        restorationHandler:^(NSArray<id<UIUserActivityRestoring>> *_Nullable restorableObjects){
        }];
}

// Same notification RCTAppDelegate posts from this callback (window size changes).
- (void)windowScene:(UIWindowScene *)windowScene
    didUpdateCoordinateSpace:(id<UICoordinateSpace>)previousCoordinateSpace
        interfaceOrientation:(UIInterfaceOrientation)previousInterfaceOrientation
             traitCollection:(UITraitCollection *)previousTraitCollection
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTWindowFrameDidChangeNotification
                                                      object:[UIApplication sharedApplication].delegate];
}

@end
