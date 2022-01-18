<template>
    <div class="flex w-full flex-col">
        <div class="flex-1 flex-grow bg-gray overflow-y-auto" v-if="loaded">
            {{ place.name }}<br />
        </div>
        <div class="flex flex-none w-full h-1/3 ">
            <chat :place="place" v-if="loaded"></chat>
        </div>
    </div>
</template>

<script>
/*eslint no-undef: 0*/
/*eslint no-unused-vars: 0*/

import Chat from "../components/Chat";
export default {
    name: 'ChatTest',
    components: {Chat},
    data: () => {
        return {
            loaded: false,
            place: {}
        };
    },
    methods: {
        getPlace() {
            console.log('get place');
            return this.$http.get('/place/'+this.$route.params.id)
                .then(response => {
                    this.place = response.data.place;
                    this.loaded = true;
                    console.log(response.data.place);
                });
        },

    },
    watch: {
        '$route.params.id': function(to, from) {
            console.log('id changed');
            this.loaded = false;
            this.getPlace();
        },

    },
    computed: {
    },
    mounted() {
        console.log('chat test mounted');
        this.loaded = false;
        this.getPlace();
    }

}
</script>
