package com.council.app.ui.auth

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.council.app.ui.theme.*

@Composable
fun SignInScreen(
    onSignedIn: () -> Unit,
    onNavigateToSignUp: () -> Unit,
    onNavigateToForgotPassword: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val focusManager = LocalFocusManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CouncilInk)
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // App header
        Text(
            text = "Council",
            style = MaterialTheme.typography.headlineLarge,
            color = CouncilCyan,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = (-1).sp,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = "Multi-model AI roundtable",
            style = MaterialTheme.typography.bodyMedium,
            color = CouncilTextSecondary,
        )

        Spacer(Modifier.height(40.dp))

        // Email field
        OutlinedTextField(
            value = email,
            onValueChange = { email = it; error = null },
            label = { Text("Email") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next,
            ),
            keyboardActions = KeyboardActions(
                onNext = { focusManager.moveFocus(FocusDirection.Down) }
            ),
            colors = outlinedTextFieldColors(),
            shape = RoundedCornerShape(12.dp),
        )

        Spacer(Modifier.height(12.dp))

        // Password field
        OutlinedTextField(
            value = password,
            onValueChange = { password = it; error = null },
            label = { Text("Password") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
            ),
            keyboardActions = KeyboardActions(
                onDone = {
                    focusManager.clearFocus()
                    doSignIn(viewModel, email, password, { isLoading = true }, { isLoading = false }, onSignedIn) { error = it }
                }
            ),
            trailingIcon = {
                TextButton(onClick = { passwordVisible = !passwordVisible }) {
                    Text(if (passwordVisible) "Hide" else "Show", color = CouncilTextSecondary)
                }
            },
            colors = outlinedTextFieldColors(),
            shape = RoundedCornerShape(12.dp),
        )

        // Forgot password
        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
            TextButton(onClick = onNavigateToForgotPassword) {
                Text("Forgot password?", color = CouncilCyan, style = MaterialTheme.typography.labelMedium)
            }
        }

        Spacer(Modifier.height(8.dp))

        // Error message
        AnimatedVisibility(visible = error != null) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = CouncilRed.copy(alpha = 0.12f),
                shape = RoundedCornerShape(8.dp),
            ) {
                Text(
                    text = error ?: "",
                    modifier = Modifier.padding(12.dp),
                    color = CouncilRed,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            Spacer(Modifier.height(12.dp))
        }

        Spacer(Modifier.height(16.dp))

        // Sign in button
        Button(
            onClick = {
                doSignIn(viewModel, email, password, { isLoading = true }, { isLoading = false }, onSignedIn) { error = it }
            },
            enabled = !isLoading && email.isNotBlank() && password.isNotBlank(),
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = CouncilCyan, contentColor = CouncilInk),
        ) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp), color = CouncilInk, strokeWidth = 2.dp)
            } else {
                Text("Sign In", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
            }
        }

        Spacer(Modifier.height(20.dp))

        TextButton(onClick = onNavigateToSignUp) {
            Text(
                "Don't have an account? Sign Up",
                color = CouncilTextSecondary,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

@Composable
fun SignUpScreen(
    onSignedUp: () -> Unit,
    onNavigateToSignIn: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val focusManager = LocalFocusManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CouncilInk)
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text("Create Account", style = MaterialTheme.typography.headlineMedium, color = CouncilTextPrimary, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(4.dp))
        Text("Join the AI council", color = CouncilTextSecondary, style = MaterialTheme.typography.bodyMedium)

        Spacer(Modifier.height(32.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it; error = null },
            label = { Text("Email") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
            keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) }),
            colors = outlinedTextFieldColors(),
            shape = RoundedCornerShape(12.dp),
        )

        Spacer(Modifier.height(12.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it; error = null },
            label = { Text("Password") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
            colors = outlinedTextFieldColors(),
            shape = RoundedCornerShape(12.dp),
        )

        Spacer(Modifier.height(8.dp))

        AnimatedVisibility(error != null) {
            Surface(modifier = Modifier.fillMaxWidth(), color = CouncilRed.copy(alpha = 0.12f), shape = RoundedCornerShape(8.dp)) {
                Text(error ?: "", modifier = Modifier.padding(12.dp), color = CouncilRed, style = MaterialTheme.typography.bodyMedium)
            }
        }

        Spacer(Modifier.height(20.dp))

        Button(
            onClick = {
                isLoading = true
                viewModel.signUp(email, password,
                    onSuccess = { isLoading = false; onSignedUp() },
                    onError = { isLoading = false; error = it }
                )
            },
            enabled = !isLoading && email.isNotBlank() && password.length >= 6,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = CouncilCyan, contentColor = CouncilInk),
        ) {
            if (isLoading) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = CouncilInk, strokeWidth = 2.dp)
            else Text("Create Account", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
        }

        Spacer(Modifier.height(16.dp))

        TextButton(onClick = onNavigateToSignIn, modifier = Modifier.fillMaxWidth()) {
            Text("Already have an account? Sign In", color = CouncilTextSecondary, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun ForgotPasswordScreen(
    onBack: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    var email by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var sent by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier.fillMaxSize().background(CouncilInk).padding(24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text("Reset Password", style = MaterialTheme.typography.headlineMedium, color = CouncilTextPrimary, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text("Enter your email to receive a reset link.", color = CouncilTextSecondary, style = MaterialTheme.typography.bodyMedium)

        Spacer(Modifier.height(32.dp))

        if (sent) {
            Surface(modifier = Modifier.fillMaxWidth(), color = CouncilGreen.copy(alpha = 0.12f), shape = RoundedCornerShape(8.dp)) {
                Text("Reset email sent! Check your inbox.", modifier = Modifier.padding(16.dp), color = CouncilGreen)
            }
        } else {
            OutlinedTextField(
                value = email,
                onValueChange = { email = it; error = null },
                label = { Text("Email") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                colors = outlinedTextFieldColors(),
                shape = RoundedCornerShape(12.dp),
            )

            AnimatedVisibility(error != null) {
                Spacer(Modifier.height(8.dp))
                Surface(modifier = Modifier.fillMaxWidth(), color = CouncilRed.copy(alpha = 0.12f), shape = RoundedCornerShape(8.dp)) {
                    Text(error ?: "", modifier = Modifier.padding(12.dp), color = CouncilRed, style = MaterialTheme.typography.bodyMedium)
                }
            }

            Spacer(Modifier.height(20.dp))

            Button(
                onClick = {
                    isLoading = true
                    viewModel.sendPasswordReset(email,
                        onSuccess = { isLoading = false; sent = true },
                        onError = { isLoading = false; error = it }
                    )
                },
                enabled = !isLoading && email.isNotBlank(),
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = CouncilCyan, contentColor = CouncilInk),
            ) {
                if (isLoading) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = CouncilInk, strokeWidth = 2.dp)
                else Text("Send Reset Email", fontWeight = FontWeight.SemiBold)
            }
        }

        Spacer(Modifier.height(16.dp))

        TextButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
            Text("← Back to Sign In", color = CouncilTextSecondary)
        }
    }
}

private fun doSignIn(
    viewModel: AuthViewModel,
    email: String,
    password: String,
    onStart: () -> Unit,
    onEnd: () -> Unit,
    onSuccess: () -> Unit,
    onError: (String) -> Unit,
) {
    onStart()
    viewModel.signIn(email, password,
        onSuccess = { onEnd(); onSuccess() },
        onError = { onEnd(); onError(it) }
    )
}

@Composable
private fun outlinedTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedContainerColor = CouncilCard,
    unfocusedContainerColor = CouncilCard,
    focusedBorderColor = CouncilCyan,
    unfocusedBorderColor = CouncilBorder,
    focusedLabelColor = CouncilCyan,
    unfocusedLabelColor = CouncilTextSecondary,
    focusedTextColor = CouncilTextPrimary,
    unfocusedTextColor = CouncilTextPrimary,
    cursorColor = CouncilCyan,
)
