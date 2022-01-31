<template>
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
        <div class="absolute
        top-10
        bottom-10
        left-1/2
        transform
        -translate-x-1/2
        border-2
        border-gray-300
        max-w-full
        shadow-lg
        bg-black
        overflow-y-hidden" style="width:1024px;">
            <div class="flex flex-row-reverse bg-gradient-to-r from-indigo-500 to-blue-500 p-1 border-b-2 border-gray-400">
                <button type="button" class="btn-ui-inline">X</button>
            </div>

            <div class="flex-1 p-5 overflow-y-auto max-h-full">
                <h3 align="center">My Home - My Information</h3>
                <p align="center">Here you can change your personal information, e.g. email address, first name, last name, short info for the citizen directory. And you could visit your private house.<br></p>

                <div align="center">
                    <table border="0">
                        <tr>
                            <td width="200" align="center"><img src="/assets/img/icon_myinfo.jpg" border=0><br><b>Personal Info</b></td>
                            <td width=200 align=center><img src="/assets/img/icon_myhouse.jpg" border=0><br><b>Visit My House</b></td>
                            <td width=200 align=center><router-link to="/myinfo/avatar"><img src="/assets/img/icon_myinfo.jpg" border=0><br><b>My Avatar</b></router-link></td>
                        </tr>
                        <tr>
                            <td width=200 align=center><router-link to="/myinfo/account"><img src="/assets/img/icon_myinfo.jpg" border=0><br><b>My Account</b></router-link></td>
                            <td width=200 align=center><img src="/assets/img/icon_myinfo.jpg" border=0><br><b>Storage Units</b></td>
                            <td width=200 align=center><img src="/assets/img/icon_myinfo.jpg" border=0><br><b>Avatar Library</b></td>
                        </tr>
                    </table>
                    <br>
                    To access and set up your Instant Message Center, click on the Online Citizens link under City Time in the right frame.
                    <br><br><br>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
/*eslint no-undef: 0*/
/*eslint no-unused-vars: 0*/

export default {
    name: "MyInfoModal",
    data: () => {
        return {};
    },
    methods: {},
    mounted() {},
};
</script>
