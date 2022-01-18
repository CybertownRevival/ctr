<template>
    <div>
        Logging out...
    </div>
</template>

<script>


export default {
    name: 'LogoutPage',
    data: () => {
        return {
        };
    },
    mounted() {
        this.$store.methods.destroySession();
		this.$router.push({ path: "/login" });
    }

}
</script>
