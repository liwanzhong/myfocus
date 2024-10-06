
<style lang="scss">
	/* 注意要写在第一行，同时给style标签加入lang="scss"属性 */
	@import "@/uni_modules/uview-ui/index.scss";

	/* 全局样式 */
:root {
  --bg-color: #d95550; /* 默认背景色 */
}

html, body, #app {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background-color: var(--bg-color);
}
</style>

<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

