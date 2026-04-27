package ai.carlito.app.ui

import androidx.compose.runtime.Composable
import ai.carlito.app.MainViewModel
import ai.carlito.app.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
