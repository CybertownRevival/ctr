<template>
	<div class="flex-1 pt-5" align="center">
		<div style="width:90%" class="flex flex-row max-w-[90%] items-center">
			<div style="width:150px;" class="text-left">
					<img
						height="55"
						width="98"
						src="/assets/img/login/visitor.jpeg"
						BORDER="0"
						ALT="Visitor"
					/>
			</div>
			<div class="flex-1 text-center">
						<img
						class="inline-block"
							src="/assets/img/login/enter.jpeg"
							width="381"
							height="139"
							border="0"
							alt="Enter Now!"
						/>

			</div>
			<div style="width:150px;" class="text-right">
					<IMG
						class="inline-block"
						HEIGHT="14"
						WIDTH="85"
						SRC="/assets/img/login/immigrate.gif"
						BORDER="0"
						ALT="Immigrate"
					/>
					<br />
					<router-link to="/signup"
						><IMG
						class="inline-block"
							HEIGHT="83"
							WIDTH="84"
							SRC="/assets/img/login/register.gif"
							BORDER="0"
							ALT="Immigrate Today!"
					/></router-link>

			</div>
		</div>

		<div class="flex w-full flex-row items-center">
				<div style="width:100px" class="text-center self-start">
				</div>
				<div style="width:120px" class="text-left">
				</div>
				<div class="flex-1 px-8">
                    <h2 class="mb-2">Forgot Password</h2>

                    <p class="mb-2">Enter your account's email address to receive instructions to reset your password.</p><br/>
					<table border="0">
						<tr align="center">
							<td align="center">Email Address</td>
							<td align="center">
								<input
									v-model="email"
									type="text"
									size="16"
									maxlength="16"
									tabindex="1"
									class="input-text"
								/>
							</td>
						</tr>
						<tr align="center">
							<td align="center" colspan="2">
								<button
									type="button"
									tabindex="3"
									class="btn"
									@click="reset"
								>
									Request Reset Link
								</button>
							</td>
						</tr>
					</table>
				</div>
				<div style="width:120px" class="text-right">
				</div>
				<div class="text-center self-start" style="width:100px">
				</div>
		</div>
		<div v-if="showError" class="text-red-500">{{ error }}</div>
	</div>
</template>

<script>
	export default {
		name: "ForgotPasswordPage",
		data: () => {
			return {
				email: "",
				showError: false,
				error: "",
			};
		},
		methods: {
			async reset() {
				this.showError = false;
				/*
				try {
					let response = await this.$http.post("/member/login", {
						username: this.username,
						password: this.password,
					});
					console.log(response);
					localStorage.setItem("token", response.data.token);
					this.$store.data.user.userName = response.data.username;
					if (this.$route.query.redirect) {
						this.$router.push({ path: this.$route.query.redirect });
					} else {
						this.$router.push({ path: "/place/enter" });
					}
				} catch (errorResponse) {
					if (errorResponse.response.data.error) {
						this.error = errorResponse.response.data.error;
						this.showError = true;
					} else {
						this.error = "An unknown error occurred";
						this.showError = true;
					}
				}
				 */
			},
		},
	};
</script>
