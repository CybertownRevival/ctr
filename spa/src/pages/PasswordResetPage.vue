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
                <h2 class="mb-2">Password Reset</h2>

                <p class="mb-2">To reset your password, please choose a new password and enter it below.</p><br/>
                <table border="0" v-show="!success">
                    <tr align="center">
                        <td align="center">New Password</td>
                        <td align="center">
                            <input
                                v-model="newPassword"
                                type="password"
                                size="16"
                                maxlength="255"
                                tabindex="1"
                                class="input-text"
                            />
                        </td>
                    </tr>
                    <tr align="center">
                        <td align="center">New Password (again)</td>
                        <td align="center">
                            <input
                                v-model="newPassword2"
                                type="password"
                                size="16"
                                maxlength="255"
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
                               Reset Password
                            </button>
                        </td>
                    </tr>
                </table>
                <p v-if="success">Your account password has been updated. <router-link to="/login">Back to Login</router-link></p>
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
            newPassword: "",
            newPassword2: "",
            showError: false,
            error: "",
            success: false
        };
    },
    methods: {
        async reset() {
            this.showError = false;
            try {
                if(this.newPassword === '' || this.newPassword2 === '' || this.newPassword !== this.newPassword2) {
                    this.error = 'Please enter your new password in exactly the same twice.';
                    this.showError = true;
                    return;
                }

                await this.$http.post("/member/reset_password", {
                    resetToken: this.$route.query.token,
                    newPassword: this.newPassword,
                    newPassword2: this.newPassword2,
                });

                this.success = true;
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
