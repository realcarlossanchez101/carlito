package ai.carlito.app.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class CarlitoProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", CarlitoCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", CarlitoCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", CarlitoCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", CarlitoCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", CarlitoCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", CarlitoCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", CarlitoCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", CarlitoCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", CarlitoCapability.Canvas.rawValue)
    assertEquals("camera", CarlitoCapability.Camera.rawValue)
    assertEquals("voiceWake", CarlitoCapability.VoiceWake.rawValue)
    assertEquals("location", CarlitoCapability.Location.rawValue)
    assertEquals("sms", CarlitoCapability.Sms.rawValue)
    assertEquals("device", CarlitoCapability.Device.rawValue)
    assertEquals("notifications", CarlitoCapability.Notifications.rawValue)
    assertEquals("system", CarlitoCapability.System.rawValue)
    assertEquals("photos", CarlitoCapability.Photos.rawValue)
    assertEquals("contacts", CarlitoCapability.Contacts.rawValue)
    assertEquals("calendar", CarlitoCapability.Calendar.rawValue)
    assertEquals("motion", CarlitoCapability.Motion.rawValue)
    assertEquals("callLog", CarlitoCapability.CallLog.rawValue)
  }

  @Test
  fun cameraCommandsUseStableStrings() {
    assertEquals("camera.list", CarlitoCameraCommand.List.rawValue)
    assertEquals("camera.snap", CarlitoCameraCommand.Snap.rawValue)
    assertEquals("camera.clip", CarlitoCameraCommand.Clip.rawValue)
  }

  @Test
  fun notificationsCommandsUseStableStrings() {
    assertEquals("notifications.list", CarlitoNotificationsCommand.List.rawValue)
    assertEquals("notifications.actions", CarlitoNotificationsCommand.Actions.rawValue)
  }

  @Test
  fun deviceCommandsUseStableStrings() {
    assertEquals("device.status", CarlitoDeviceCommand.Status.rawValue)
    assertEquals("device.info", CarlitoDeviceCommand.Info.rawValue)
    assertEquals("device.permissions", CarlitoDeviceCommand.Permissions.rawValue)
    assertEquals("device.health", CarlitoDeviceCommand.Health.rawValue)
  }

  @Test
  fun systemCommandsUseStableStrings() {
    assertEquals("system.notify", CarlitoSystemCommand.Notify.rawValue)
  }

  @Test
  fun photosCommandsUseStableStrings() {
    assertEquals("photos.latest", CarlitoPhotosCommand.Latest.rawValue)
  }

  @Test
  fun contactsCommandsUseStableStrings() {
    assertEquals("contacts.search", CarlitoContactsCommand.Search.rawValue)
    assertEquals("contacts.add", CarlitoContactsCommand.Add.rawValue)
  }

  @Test
  fun calendarCommandsUseStableStrings() {
    assertEquals("calendar.events", CarlitoCalendarCommand.Events.rawValue)
    assertEquals("calendar.add", CarlitoCalendarCommand.Add.rawValue)
  }

  @Test
  fun motionCommandsUseStableStrings() {
    assertEquals("motion.activity", CarlitoMotionCommand.Activity.rawValue)
    assertEquals("motion.pedometer", CarlitoMotionCommand.Pedometer.rawValue)
  }

  @Test
  fun smsCommandsUseStableStrings() {
    assertEquals("sms.send", CarlitoSmsCommand.Send.rawValue)
    assertEquals("sms.search", CarlitoSmsCommand.Search.rawValue)
  }

  @Test
  fun callLogCommandsUseStableStrings() {
    assertEquals("callLog.search", CarlitoCallLogCommand.Search.rawValue)
  }

}
