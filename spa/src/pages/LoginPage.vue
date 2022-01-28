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
						<img src="/assets/img/login/bestchat.gif" class="inline-block" /><BR /><FONT
							FACE="arial"
							SIZE="-1"
							COLOR="#00DD00"
							>Chosen by YAHOO! as coolest chat site for
							2001
							</FONT>
							<br/>
						<FONT COLOR="#80FF00" SIZE="+2">E</FONT
						><FONT COLOR="#80FF00" SIZE="+1">NTER</FONT
						><FONT COLOR="#80FF00" SIZE="+2"> C</FONT
						><FONT COLOR="#80FF00" SIZE="+1">YBERTOWN</FONT>
						<br />
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
					<img
						NAME="forgot"
						SRC="/assets/img/login/resend.jpeg"
						ALT="forgot your password"
						border="0"
						class="inline-block"
					/>
				</div>
				<div style="width:120px" class="text-left">
					If you forgot your Password, click
						<a href="">here</a> and we will <a href="">email</a> it
						to you.
						<font color="red"><strong>NEVER, EVER give your password to anyone else,
								no matter who they claim to be or what jobs they
								offer you!</strong></font>
				</div>
				<div class="flex-1 px-8">
					<table border="0">
						<tr align="center">
							<td align="center">Nickname</td>
							<td align="center">
								<input
									v-model="username"
									type="text"
									size="16"
									maxlength="16"
									tabindex="1"
									class="input-text"
								/>
							</td>
						</tr>
						<tr align="center">
							<td align="center">Password</td>
							<td align="center">
								<input
									v-model="password"
									type="password"
									size="16"
									maxlength="16"
									tabindex="2"
									@keypress.exact.enter="login"
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
									@click="login"
								>
									Enter
								</button>
							</td>
						</tr>
					</table>
				</div>
				<div style="width:120px" class="text-right">
						>If you want to <A HREF="">change</A> your Password,
						click <A href="">here</A>.
						<font color="yellow"
							><strong
								>ALWAYS make your password something that it
								would be VERY HARD for anyone to guess!</strong
							></font>
				</div>
				<div class="text-center self-start" style="width:100px">
					<img
						name="chpass"
						type="Image"
						src="/assets/img/login/change_enter.jpeg"
						alt="change password"
						align="middle"
						border="0"
						class="inline-block"
					/>
				</div>
		</div>
		<div v-if="showError" class="text-red-500">{{ error }}</div>

		<p>
	<strong>Immigration or Login Problems?</strong> Check the
<a href="" target="_self">Quick Help</a>!<br /><br />
			<font size="+1" color="#FFFF00">
				<strong>Please note:</strong> to enter the site your browser
				must accept cookies.
			</font>
				<font color="#FFFF00">
					<br />Netscape 4.x: menu 'edit-preferences-advanced-accept
					cookies' IE 4.x: menu 'view-internet options-advanced-accept
					cookies'
				</font>
		</p>
	</div>
</template>

<script>
	export default {
		name: "LoginPage",
		data: () => {
			return {
				username: "",
				password: "",
				showError: false,
				error: "",
			};
		},
		methods: {
			async login() {
				this.showError = false;
				try {
					let response = await this.$http.post("/member/login", {
						username: this.username,
						password: this.password,
					});
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
			},
		},
	};
</script>
