#import <UIKit/UIKit.h>
#import <React/RCTView.h>
#import <React/RCTViewManager.h>

@interface FFSecureCaptureView : RCTView
@property (nonatomic, strong) UITextField *secureTextField;
@property (nonatomic, weak) UIView *secureContentView;
@end

@implementation FFSecureCaptureView

- (instancetype)init
{
  if ((self = [super init])) {
    self.backgroundColor = UIColor.clearColor;
    self.clipsToBounds = YES;

    _secureTextField = [UITextField new];
    _secureTextField.secureTextEntry = YES;
    _secureTextField.text = @" ";
    _secureTextField.textColor = UIColor.clearColor;
    _secureTextField.tintColor = UIColor.clearColor;
    _secureTextField.backgroundColor = UIColor.clearColor;
    _secureTextField.borderStyle = UITextBorderStyleNone;
    _secureTextField.clipsToBounds = YES;

    [self addSubview:_secureTextField];
    [self updateSecureContentView];
  }
  return self;
}

- (UIView *)findSecureCanvas
{
  for (UIView *subview in self.secureTextField.subviews) {
    NSString *className = NSStringFromClass(subview.class);
    if ([className containsString:@"Canvas"] || [className containsString:@"Content"]) {
      return subview;
    }
  }
  return self.secureTextField.subviews.firstObject ?: self.secureTextField;
}

- (void)updateSecureContentView
{
  UIView *contentView = [self findSecureCanvas];
  if (contentView == self.secureContentView) {
    return;
  }

  self.secureContentView = contentView;
  self.secureContentView.backgroundColor = UIColor.clearColor;
  self.secureContentView.userInteractionEnabled = YES;
  self.secureContentView.clipsToBounds = YES;
  [self didUpdateReactSubviews];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  self.secureTextField.frame = self.bounds;
  [self updateSecureContentView];
  self.secureContentView.frame = self.bounds;
}

- (void)didUpdateReactSubviews
{
  [self updateSecureContentView];
  for (UIView *subview in self.reactSubviews) {
    [self.secureContentView addSubview:subview];
  }
}

@end

@interface FFSecureCaptureViewManager : RCTViewManager
@end

@implementation FFSecureCaptureViewManager

RCT_EXPORT_MODULE(FFSecureCaptureView)

- (UIView *)view
{
  return [FFSecureCaptureView new];
}

@end
