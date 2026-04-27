package ai.carlito.app.node

import ai.carlito.app.protocol.CarlitoCalendarCommand
import ai.carlito.app.protocol.CarlitoCameraCommand
import ai.carlito.app.protocol.CarlitoCallLogCommand
import ai.carlito.app.protocol.CarlitoCapability
import ai.carlito.app.protocol.CarlitoContactsCommand
import ai.carlito.app.protocol.CarlitoDeviceCommand
import ai.carlito.app.protocol.CarlitoLocationCommand
import ai.carlito.app.protocol.CarlitoMotionCommand
import ai.carlito.app.protocol.CarlitoNotificationsCommand
import ai.carlito.app.protocol.CarlitoPhotosCommand
import ai.carlito.app.protocol.CarlitoSmsCommand
import ai.carlito.app.protocol.CarlitoSystemCommand
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InvokeCommandRegistryTest {
  private val coreCapabilities =
    setOf(
      CarlitoCapability.Canvas.rawValue,
      CarlitoCapability.Device.rawValue,
      CarlitoCapability.Notifications.rawValue,
      CarlitoCapability.System.rawValue,
      CarlitoCapability.Photos.rawValue,
      CarlitoCapability.Contacts.rawValue,
      CarlitoCapability.Calendar.rawValue,
    )

  private val optionalCapabilities =
    setOf(
      CarlitoCapability.Camera.rawValue,
      CarlitoCapability.Location.rawValue,
      CarlitoCapability.Sms.rawValue,
      CarlitoCapability.CallLog.rawValue,
      CarlitoCapability.VoiceWake.rawValue,
      CarlitoCapability.Motion.rawValue,
    )

  private val coreCommands =
    setOf(
      CarlitoDeviceCommand.Status.rawValue,
      CarlitoDeviceCommand.Info.rawValue,
      CarlitoDeviceCommand.Permissions.rawValue,
      CarlitoDeviceCommand.Health.rawValue,
      CarlitoNotificationsCommand.List.rawValue,
      CarlitoNotificationsCommand.Actions.rawValue,
      CarlitoSystemCommand.Notify.rawValue,
      CarlitoPhotosCommand.Latest.rawValue,
      CarlitoContactsCommand.Search.rawValue,
      CarlitoContactsCommand.Add.rawValue,
      CarlitoCalendarCommand.Events.rawValue,
      CarlitoCalendarCommand.Add.rawValue,
    )

  private val optionalCommands =
    setOf(
      CarlitoCameraCommand.Snap.rawValue,
      CarlitoCameraCommand.Clip.rawValue,
      CarlitoCameraCommand.List.rawValue,
      CarlitoLocationCommand.Get.rawValue,
      CarlitoMotionCommand.Activity.rawValue,
      CarlitoMotionCommand.Pedometer.rawValue,
      CarlitoSmsCommand.Send.rawValue,
      CarlitoSmsCommand.Search.rawValue,
      CarlitoCallLogCommand.Search.rawValue,
    )

  private val debugCommands = setOf("debug.logs", "debug.ed25519")

  @Test
  fun advertisedCapabilities_respectsFeatureAvailability() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags())

    assertContainsAll(capabilities, coreCapabilities)
    assertMissingAll(capabilities, optionalCapabilities)
  }

  @Test
  fun advertisedCapabilities_includesFeatureCapabilitiesWhenEnabled() {
    val capabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          sendSmsAvailable = true,
          readSmsAvailable = true,
          smsSearchPossible = true,
          callLogAvailable = true,
          voiceWakeEnabled = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
        ),
      )

    assertContainsAll(capabilities, coreCapabilities + optionalCapabilities)
  }

  @Test
  fun advertisedCommands_respectsFeatureAvailability() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags())

    assertContainsAll(commands, coreCommands)
    assertMissingAll(commands, optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_includesFeatureCommandsWhenEnabled() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          sendSmsAvailable = true,
          readSmsAvailable = true,
          smsSearchPossible = true,
          callLogAvailable = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
          debugBuild = true,
        ),
      )

    assertContainsAll(commands, coreCommands + optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_onlyIncludesSupportedMotionCommands() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        NodeRuntimeFlags(
          cameraEnabled = false,
          locationEnabled = false,
          sendSmsAvailable = false,
          readSmsAvailable = false,
          smsSearchPossible = false,
          callLogAvailable = false,
          voiceWakeEnabled = false,
          motionActivityAvailable = true,
          motionPedometerAvailable = false,
          debugBuild = false,
        ),
      )

    assertTrue(commands.contains(CarlitoMotionCommand.Activity.rawValue))
    assertFalse(commands.contains(CarlitoMotionCommand.Pedometer.rawValue))
  }

  @Test
  fun advertisedCommands_splitsSmsSendAndSearchAvailability() {
    val readOnlyCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(readSmsAvailable = true, smsSearchPossible = true),
      )
    val sendOnlyCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(sendSmsAvailable = true),
      )
    val requestableSearchCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(smsSearchPossible = true),
      )

    assertTrue(readOnlyCommands.contains(CarlitoSmsCommand.Search.rawValue))
    assertFalse(readOnlyCommands.contains(CarlitoSmsCommand.Send.rawValue))
    assertTrue(sendOnlyCommands.contains(CarlitoSmsCommand.Send.rawValue))
    assertFalse(sendOnlyCommands.contains(CarlitoSmsCommand.Search.rawValue))
    assertTrue(requestableSearchCommands.contains(CarlitoSmsCommand.Search.rawValue))
  }

  @Test
  fun advertisedCapabilities_includeSmsWhenEitherSmsPathIsAvailable() {
    val readOnlyCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(readSmsAvailable = true),
      )
    val sendOnlyCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(sendSmsAvailable = true),
      )
    val requestableSearchCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(smsSearchPossible = true),
      )

    assertTrue(readOnlyCapabilities.contains(CarlitoCapability.Sms.rawValue))
    assertTrue(sendOnlyCapabilities.contains(CarlitoCapability.Sms.rawValue))
    assertFalse(requestableSearchCapabilities.contains(CarlitoCapability.Sms.rawValue))
  }

  @Test
  fun advertisedCommands_excludesCallLogWhenUnavailable() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags(callLogAvailable = false))

    assertFalse(commands.contains(CarlitoCallLogCommand.Search.rawValue))
  }

  @Test
  fun advertisedCapabilities_excludesCallLogWhenUnavailable() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags(callLogAvailable = false))

    assertFalse(capabilities.contains(CarlitoCapability.CallLog.rawValue))
  }

  @Test
  fun advertisedCapabilities_includesVoiceWakeWithoutAdvertisingCommands() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags(voiceWakeEnabled = true))
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags(voiceWakeEnabled = true))

    assertTrue(capabilities.contains(CarlitoCapability.VoiceWake.rawValue))
    assertFalse(commands.any { it.contains("voice", ignoreCase = true) })
  }

  @Test
  fun find_returnsForegroundMetadataForCameraCommands() {
    val list = InvokeCommandRegistry.find(CarlitoCameraCommand.List.rawValue)
    val location = InvokeCommandRegistry.find(CarlitoLocationCommand.Get.rawValue)

    assertNotNull(list)
    assertEquals(true, list?.requiresForeground)
    assertNotNull(location)
    assertEquals(false, location?.requiresForeground)
  }

  @Test
  fun find_returnsNullForUnknownCommand() {
    assertNull(InvokeCommandRegistry.find("not.real"))
  }

  private fun defaultFlags(
    cameraEnabled: Boolean = false,
    locationEnabled: Boolean = false,
    sendSmsAvailable: Boolean = false,
    readSmsAvailable: Boolean = false,
    smsSearchPossible: Boolean = false,
    callLogAvailable: Boolean = false,
    voiceWakeEnabled: Boolean = false,
    motionActivityAvailable: Boolean = false,
    motionPedometerAvailable: Boolean = false,
    debugBuild: Boolean = false,
  ): NodeRuntimeFlags =
    NodeRuntimeFlags(
      cameraEnabled = cameraEnabled,
      locationEnabled = locationEnabled,
      sendSmsAvailable = sendSmsAvailable,
      readSmsAvailable = readSmsAvailable,
      smsSearchPossible = smsSearchPossible,
      callLogAvailable = callLogAvailable,
      voiceWakeEnabled = voiceWakeEnabled,
      motionActivityAvailable = motionActivityAvailable,
      motionPedometerAvailable = motionPedometerAvailable,
      debugBuild = debugBuild,
    )

  private fun assertContainsAll(actual: List<String>, expected: Set<String>) {
    expected.forEach { value -> assertTrue(actual.contains(value)) }
  }

  private fun assertMissingAll(actual: List<String>, forbidden: Set<String>) {
    forbidden.forEach { value -> assertFalse(actual.contains(value)) }
  }
}
