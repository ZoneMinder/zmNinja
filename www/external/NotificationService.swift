// Credit: https://github.com/phonegap/phonegap-plugin-push/issues/1347#issuecomment-450206184
import UserNotifications

class NotificationService: UNNotificationServiceExtension {
    
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    
    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        self.bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        guard let content = bestAttemptContent else {
            #if DEBUG
            exitGracefully("bestAttemptContent not a UNMutableNotificationContent")
            #endif
            return
        }
        
        DispatchQueue.main.async { [weak self] in
            let userInfo: [AnyHashable: Any] = request.content.userInfo
            content.attachments = self?.attachmentsFor(userInfo) ?? []
            guard let copy = self?.bestAttemptContent else {
                #if DEBUG
                self?.exitGracefully("bestAttemptContent is nil")
                #endif
                return
            }
            contentHandler(copy)
        }
    }
    
    override func serviceExtensionTimeWillExpire() {
        if let contentHandler = contentHandler, let content = self.bestAttemptContent {
            contentHandler(content)
        }
    }
    
    /// Helper function to extract Attachments from an userInfo object
    ///
    /// - Attribute userInfo: The user info extracted from the notification,
    ///                       which should contain one of the available keys to create
    ///                       a rich push notification.
    private func attachmentsFor(_ userInfo: [AnyHashable: Any]) -> [UNNotificationAttachment] {
        if let attachmentURLString = userInfo["image_url_png"] as? String {
            guard let attachmentURL = URL(string: attachmentURLString),
                let imageData = try? Data(contentsOf: attachmentURL),
                let attachment = self.save("image.png", data: imageData, options: nil) else {
                    #if DEBUG
                    self.exitGracefully("PNG was not saved properly")
                    #endif
                    return []
            }
            return [attachment]
        } else if let attachmentURLString = userInfo["image_url_jpg"] as? String {
            guard let attachmentURL = URL(string: attachmentURLString),
                let imageData = try? Data(contentsOf: attachmentURL),
                let attachment = self.save("image.jpg", data: imageData, options: nil) else {
                    #if DEBUG
                    self.exitGracefully("JPG was not saved properly")
                    #endif
                    return []
            }
            return [attachment]
        } else if let attachmentURLString = userInfo["image_url_gif"] as? String {
            guard let attachmentURL = URL(string: attachmentURLString),
                let imageData = try? Data(contentsOf: attachmentURL),
                let attachment = self.save("image.gif", data: imageData, options: nil) else {
                    #if DEBUG
                    self.exitGracefully("GIF was not saved properly")
                    #endif
                    return []
            }
            return [attachment]
        }
        
        return []
    }
    
    /// Save data object onto disk and return an optional attachment linked to this path.
    ///
    /// - Attributes:
    ///   - identifier: The unique identifier of the attachment.
    ///                 Use this string to identify the attachment later. If you specify an
    ///                 empty string, this method creates a unique identifier string for you.
    ///   - data: The data stored onto disk.
    ///   - options: A dictionary of options related to the attached file.
    ///              Use the options to specify meta information about the attachment,
    ///              such as the clipping rectangle to use for the resulting thumbnail.
    private func save(_ identifier: String, data: Data, options: [AnyHashable: Any]?) -> UNNotificationAttachment? {
        // Create paths
        let directory = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(ProcessInfo.processInfo.globallyUniqueString, isDirectory: true)
        let fileURL = directory.appendingPathComponent(identifier)
        // Write data on disk
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true, attributes: nil)
        try? data.write(to: fileURL, options: [])
        // Create Notification attachment
        return try? UNNotificationAttachment(identifier: identifier, url: fileURL, options: options)
    }
    
    /// Something went wrong, so maybe we want to clean up and present a fallback to the user.
    ///
    /// - Attribute reason: The reason why something went wrong.
    private func exitGracefully(_ reason: String = "") {
        guard let copy = bestAttemptContent?.mutableCopy() as? UNMutableNotificationContent else { return }
        copy.title = reason
        contentHandler?(copy)
    }
    
}
