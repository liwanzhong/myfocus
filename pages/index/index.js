import { ref, provide, computed } from 'vue'
export default {
    setup() {
        const bgColor = ref('#d95550')

        // 提供一个计算属性来动态更新背景色
        provide('bgColor', computed(() => bgColor.value))

        return {
            bgColor
        }
    },
    data() {
        return {
            tabsList: [
                { name: '专注', value: 0, time: 25 * 60 },
                { name: '短休息', value: 1, time: 5 * 60 },
                { name: '长休息', value: 2, time: 15 * 60 }
            ],
            currentTab: 0,
            time: 25 * 60, // 5分钟
            timerRunning: false,
            sessionCount: 1,
            timer: null,
            sessionMessage: '',
            newTaskName: '',
            noteContent: '',
            tasks: [],
            newTask: { title: '', note: '', totalCount: 1, completedCount: 0, completed: false },
            totalPomos: 5,
            bgColor: '#d95550', // 默认背景颜色
            showAddTaskModal: false,
            newTaskName: '',
            estimatedPomodoros: 1,
            showPicker: false,
            options: [
                { text: '清除已经完成的任务', value: 'clear_finished' },
                { text: '清除所有的任务', value: 'clear_all' }
            ],
            draggedTask: null,
            dragStartY: 0,
            originalIndex: null,
            showAddTaskModal: false,
            editingTaskIndex: null,
            newTaskName: '',
            estimatedPomodoros: 1,
            noteContent: '',
            currentTaskIndex: null, // 新增：跟踪当前正在执行的任务索引
            completedFocusSessions: 0, // 新增：记录完成的专注会话数
            audioContext: null,
            audioBuffer: null,
            audioSource: null,
            notificationAudio: null,
            showFullscreenFocus: false,
            showBestPracticesGuide: false,
            showPauseReasonModal: false,
            pauseReason: '',
            pauseHistory: [],
            showTaskActionSheet: false,
            taskActions: [
                { text: '编辑', value: 'edit_task' },
                { text: '打扰历史', value: 'dump_list' }
            ],
            currentEditingTaskIndex: null,
            showDisturbanceHistory: false,
            currentTaskDisturbanceHistory: [],
            isPc: false,

        }
    },
    computed: {
        formattedTime() {
            const minutes = Math.floor(this.time / 60)
            const seconds = this.time % 60
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        },
        totalPomosComputed() {
            return this.tasks.reduce((total, task) => total + task.totalCount, 0);
        },

        completedPomos() {
            return this.tasks.reduce((total, task) => total + task.completedCount, 0);
        },
        remainingTimeForAllTasks() {
            // 计算未完成的番茄钟总数
            const unfinishedPomos = this.tasks.reduce((total, task) => {
                return total + (task.totalCount - task.completedCount);
            }, 0);

            // 计算总时间（包括番茄钟、短休息和长休息）
            let totalMinutes = 0;
            for (let i = 0; i < unfinishedPomos; i++) {
                totalMinutes += 25; // 每个番茄钟25分钟
                if ((i + 1) % 4 === 0) {
                    totalMinutes += 15; // 每4个番茄钟后有15分钟长休息
                } else {
                    totalMinutes += 5; // 其他情况有5分钟短休息
                }
            }

            // 计算小时和分钟
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;

            // 格式化输出
            return `${hours}小时${minutes}分钟`;
        },
        estimatedFinishTime() {
            // 获取当前时间
            const now = new Date();

            // 计算未完成的番茄钟总数
            const unfinishedPomos = this.tasks.reduce((total, task) => {
                return total + (task.totalCount - task.completedCount);
            }, 0);

            // 计算总分钟数
            let totalMinutes = 0;
            for (let i = 0; i < unfinishedPomos; i++) {
                totalMinutes += 25; // 每个番茄钟25分钟
                if ((i + 1) % 4 === 0) {
                    totalMinutes += 15; // 每4个番茄钟后有15分钟长休息
                } else {
                    totalMinutes += 5; // 其他情况有5分钟短休息
                }
            }

            // 计算预计完成时间
            const finishTime = new Date(now.getTime() + totalMinutes * 60000);

            // 格式化输出时间
            const hours = finishTime.getHours().toString().padStart(2, '0');
            const minutes = finishTime.getMinutes().toString().padStart(2, '0');

            return `${hours}:${minutes}`;
        },
        currentSessionMessage() {
            if (this.tasks.length === 0 || !this.tasks.some(task => !task.completed)) {
                // 如果没有任务或所有任务都已完成，返回默认消息
                switch (this.currentTab) {
                    case 0:
                        return '专注时刻！';
                    case 1:
                        return '休息一下吧！';
                    case 2:
                        return '放松一下吧！';
                    default:
                        return '';
                }
            } else {
                // 返回第一个未完成任务的标题，无论当前是哪种状态
                const firstUncompletedTask = this.tasks.find(task => !task.completed);
                return firstUncompletedTask ? firstUncompletedTask.title : '';
            }
        },
    },
    methods: {
        openBestPracticesGuide() {
            this.showBestPracticesGuide = true;
        },
        closeBestPracticesGuide() {
            this.showBestPracticesGuide = false;
        },
        openFullscreenFocus() {
            this.showFullscreenFocus = true;
        },

        closeFullscreenFocus() {
            this.showFullscreenFocus = false;
        },
        async initBackgroundMusic() {
            console.log('初始化背景音乐');
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            try {
                const response = await fetch('/static/audio/background-music.mp3');
                const arrayBuffer = await response.arrayBuffer();
                this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                console.log('背景音乐已加载和解码');
            } catch (error) {
                console.error('加载或解码背景音乐时出错:', error);
            }
        },

        playBackgroundMusic() {
            if (!this.audioBuffer) {
                console.error('音频缓冲区未准备好');
                return;
            }

            if (this.audioSource) {
                this.audioSource.stop();
            }

            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = this.audioBuffer;
            this.audioSource.connect(this.audioContext.destination);
            this.audioSource.loop = true;
            this.audioSource.start(0);
            console.log('开始播放背景音乐');
        },

        pauseBackgroundMusic() {
            if (this.audioSource) {
                this.audioSource.stop();
                this.audioSource = null;
            }
            console.log('暂停背景音乐');
        },

        stopBackgroundMusic() {
            if (this.audioSource) {
                this.audioSource.stop();
                this.audioSource.disconnect();
                this.audioSource = null;
            }
            console.log('停止背景音乐');
        },
        updateSessionMessage() {
            this.sessionMessage = this.currentSessionMessage;
        },
        onTaskStatusChange() {
            this.updateSessionMessage();
        },
        confirmResetSession() {
            uni.showModal({
                title: '重置番茄数量',
                content: '请确认是否重置？',
                success: (res) => {
                    if (res.confirm) {
                        this.resetSession();
                    }
                }
            });
        },

        resetSession() {
            this.sessionCount = 1;
            // 移除对 completedPomos 的重置
            this.updateTimerStatus(); // 更新计时器状态
            this.$u.toast('当前番茄已重置！')
        },
        deleteTask(index) {
            this.tasks.splice(index, 1);
            this.saveTasks();
            this.updateTaskStatus();
            this.closeTaskModal();
            this.onTaskStatusChange();
        },
        onTabChange(item) {
            this.currentTab = item.value;
            if (item.time !== undefined) {
                this.time = item.time;
            } else {
                console.error('时间值未定义');
                this.time = 25 * 60;
            }
            this.resetTimer();
            this.updateTheme();
            this.updateSessionMessage();

            // 处理背景音乐
            if (this.currentTab === 0) { // 切换到专注状态
                if (this.timerRunning) {
                    this.playBackgroundMusic();
                } else {
                    this.stopBackgroundMusic();
                }
            } else {
                this.stopBackgroundMusic();
            }
        },
        handleTimerToggle() {
            if (this.timerRunning) {
                clearInterval(this.timer);
                this.timerRunning = false;
                if (this.currentTab === 0) { // 专注状态
                    this.pauseBackgroundMusic();
                }
                // 关闭屏幕常亮
                uni.setKeepScreenOn({
                    keepScreenOn: false
                });
                this.showPauseReasonModal = true;
            } else {
                this.toggleTimer();
            }
        },

        toggleTimer() {
            if (this.timerRunning) {
                clearInterval(this.timer);
                this.timerRunning = false;
                if (this.currentTab === 0) { // 专注状态
                    this.pauseBackgroundMusic();
                }
                // 检查是否支持 setKeepScreenOn
                if (typeof uni.setKeepScreenOn === 'function') {
                    uni.setKeepScreenOn({
                        keepScreenOn: false
                    });
                }
            } else {
                this.setCurrentTask();
                this.timer = setInterval(() => {
                    if (this.time > 0) {
                        this.time--;
                    } else {
                        this.completeSession();
                    }
                }, 1000);
                this.timerRunning = true;
                if (this.currentTab === 0) { // 专注状态
                    this.playBackgroundMusic();
                }
                // 开启屏幕常亮
                uni.setKeepScreenOn({
                    keepScreenOn: true
                });
            }
            this.updateSessionMessage();
        },

        completeSession() {
            if (this.currentTab === 0) { // 当前是专注状态且倒计时结束
                this.playNotificationSound(); // 播放提示音
                this.stopBackgroundMusic(); // 停止背景音乐
                this.completePomodoro(); // 完成一个番茄钟
            }
            // 关闭屏幕常亮
            uni.setKeepScreenOn({
                keepScreenOn: false
            });
            this.nextSession();
        },


        setCurrentTask() {
            // 找到第一个未完成的任务
            this.currentTaskIndex = this.tasks.findIndex(task => !task.completed && task.completedCount < task.totalCount);
            if (this.currentTaskIndex === -1) {
                this.currentTaskIndex = null; // 如果没有未完成的任务，将 currentTaskIndex 设置为 null
            }
            console.log('Current task index set to:', this.currentTaskIndex);
        },

        completePomodoro() {
            if (this.currentTaskIndex !== null && this.currentTaskIndex < this.tasks.length) {
                const currentTask = this.tasks[this.currentTaskIndex];
                currentTask.completedCount = Math.min(currentTask.completedCount + 1, currentTask.totalCount);

                console.log(`任务 "${currentTask.title}" 完成的番茄钟数: ${currentTask.completedCount}/${currentTask.totalCount}`);

                if (currentTask.completedCount >= currentTask.totalCount) {
                    currentTask.completed = true;
                    console.log(`任务 "${currentTask.title}" 已完成`);
                    this.currentTaskIndex = null; // 重置当前任务索引
                }

                this.$set(this.tasks, this.currentTaskIndex, currentTask);
                this.updateTaskStatus();
                this.saveTasks();
                this.reorderTasks();
            }

            this.updateTimerStatus();
            this.setCurrentTask(); // 在完成番茄钟后重新设置当前任务
            this.updateSessionMessage();

            // this.playNotificationSound();
        },
        playNotificationSound() {
            if (!this.notificationAudio) {
                this.notificationAudio = uni.createInnerAudioContext();
                this.notificationAudio.src = '/static/audio/alarm-wood.mp3';
                this.notificationAudio.onError((res) => {
                    console.error('音频播放错误:', res.errMsg);
                });
            }
            this.notificationAudio.play();
        },
        showCompletionNotification() {
            // 显示通知的代码（根据平台和需求实现）
            this.$u.toast('恭喜你！完成一个番茄！')
        },
        resetTimer() {
            clearInterval(this.timer);
            this.timerRunning = false;
            switch (this.currentTab) {
                case 0:
                    this.time = 25 * 60;
                    break;
                case 1:
                    this.time = 5 * 60;
                    break;
                case 2:
                    this.time = 15 * 60;
                    break;
            }
        },
        updateTheme() {
            switch (this.currentTab) {
                case 0:
                    this.bgColor = '#d95550'
                    break
                case 1:
                    this.bgColor = '#468e91'
                    break
                case 2:
                    this.bgColor = '#437ea8'
                    break
            }
            this.$forceUpdate()
        },
        toggleTaskCompletion(index) {
            const task = this.tasks[index];
            task.completed = !task.completed;
            if (task.completed) {
                task.completedCount = task.totalCount;
            } else {
                task.completedCount = 0;
            }
            this.reorderTasks();
            this.updateTaskStatus();
            this.saveTasks();
            this.updateSessionMessage();
            this.onTaskStatusChange();
        },

        onTaskCompletionChange(index) {
            const task = this.tasks[index];
            task.completed = !task.completed;
            console.log(`任务 ${index} 完成状态更改为:`, task.completed);
            if (task.completed) {
                task.completedCount = task.totalCount;
            } else {
                task.completedCount = 0;
            }
            this.$set(this.tasks, index, task); // 确保视图更新
            this.reorderTasks();
            this.updateTaskStatus();
            this.saveTasks();
            this.updateSessionMessage();
            this.onTaskStatusChange();
        },

        updateTaskStatus() {
            // 移除对 completedPomos 的更新，因为它现在是一个计算属性
            // 更新剩余时间和预计完成时间
            this.updateRemainingTimeAndFinishTime();
        },

        updateRemainingTimeAndFinishTime() {
            const now = new Date();
            const unfinishedPomos = this.tasks.reduce((sum, task) => sum + (task.totalCount - task.completedCount), 0);

            let totalMinutes = 0;
            for (let i = 0; i < unfinishedPomos; i++) {
                totalMinutes += 25; // 每个番茄钟25分钟
                if ((i + 1) % 4 === 0) {
                    totalMinutes += 15; // 每4个番茄钟后有15分钟长休息
                } else {
                    totalMinutes += 5; // 其他情况有5分钟短休息
                }
            }

            // 更新剩余时间
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            this.remainingTimeForAllTasks = `${hours}小时${minutes}分钟`;

            // 更新预计完成时间
            const finishTime = new Date(now.getTime() + totalMinutes * 60000);
            this.estimatedFinishTime = `${finishTime.getHours().toString().padStart(2, '0')}:${finishTime.getMinutes().toString().padStart(2, '0')}`;
        },
        openNewTaskModal() {
            this.editingTaskIndex = null;
            this.newTaskName = '';
            this.estimatedPomodoros = 1;
            this.noteContent = '';
            this.showAddTaskModal = true;
        },
        saveTask() {
            if (this.newTaskName) {
                const taskData = {
                    id: Date.now(), // 使用时间戳作为唯一ID
                    title: this.newTaskName,
                    totalCount: this.estimatedPomodoros,
                    note: this.noteContent,
                    completed: false,
                    completedCount: 0
                };

                if (this.editingTaskIndex !== null) {
                    // 编辑现有任务
                    this.tasks[this.editingTaskIndex] = {
                        ...this.tasks[this.editingTaskIndex],
                        ...taskData
                    };
                } else {
                    // 添加新任务
                    const lastIncompleteIndex = this.tasks.findLastIndex(task => !task.completed);

                    if (lastIncompleteIndex === -1) {
                        // 如果没有未完成的任务，将新任务添加到数组开头
                        this.tasks.unshift(taskData);
                    } else {
                        // 将新任务插入到最后一个未完成任务的后面
                        this.tasks.splice(lastIncompleteIndex + 1, 0, taskData);
                    }
                }

                this.saveTasks(); // 保存到本地存储
                this.updateTaskStatus(); // 更新任务状态
                this.closeTaskModal();
                this.onTaskStatusChange(); // 更新任务状态和会话消息
            }
        },

        closeTaskModal() {
            this.showAddTaskModal = false;
            this.editingTaskIndex = null;
            this.newTaskName = '';
            this.estimatedPomodoros = 1;
            this.noteContent = '';
        },
        saveTasks() {
            const tasksToSave = JSON.stringify(this.tasks);
            console.log('保存到存储的任务:', tasksToSave);
            uni.setStorage({
                key: 'tasks',
                data: tasksToSave,
                success: () => {
                    console.log('任务已成功保存到本地存储');
                },
                fail: (err) => {
                    console.error('保存任务失败:', err);
                }
            });
        },
        loadTasks() {
            uni.getStorage({
                key: 'tasks',
                success: (res) => {
                    try {
                        const parsedTasks = JSON.parse(res.data);
                        if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
                            this.tasks = parsedTasks.map(task => ({
                                ...task,
                                completed: Boolean(task.completed)
                            }));
                        } else {
                            this.initializeDefaultTasks();
                        }
                    } catch (error) {
                        console.error('解析任务数据时出错:', error);
                        this.initializeDefaultTasks();
                    }
                    this.reorderTasks();
                    this.updateTaskStatus();
                },
                fail: (err) => {
                    console.error('加载任务失败:', err);
                    this.initializeDefaultTasks();
                }
            });
            this.onTaskStatusChange();
        },

        initializeDefaultTasks() {
            this.tasks = [{
                id: Date.now(),
                title: '开始你的第一个任务',
                totalCount: 1,
                completedCount: 0,
                completed: false,
                note: ''
            }];
            console.log('初始化默认任务');
        },

        onTaskComplete(index) {
            const task = this.tasks[index];
            task.completedCount++;
            if (task.completedCount >= task.totalCount) {
                task.completed = true;
            }
            this.reorderTasks();
            this.updateTaskStatus();
            this.saveTasks();
        },
        reorderTasks() {
            // 将任务分为已完成和未完成两组
            const incompleteTasks = this.tasks.filter(task => !task.completed);
            const completedTasks = this.tasks.filter(task => task.completed);

            // 合并两组任务，未完成的在前，已完成的在后
            this.tasks = [...incompleteTasks, ...completedTasks];
        },
        onMoreIconTap(index, event) {
            // 阻止事件冒泡
            if (event && event.stopPropagation) {
                event.stopPropagation();
            }
            // 调用原来的方法
            this.showTaskOptions(index);
        },

        showTaskOptions(index) {
            this.currentEditingTaskIndex = index;
            this.showTaskActionSheet = true;
        },

        handleTaskAction(actionData) {
            this.showTaskActionSheet = false;
            const actionIndex = actionData.indexs[0]; // 从对象中提取索引
            console.log('actionIndex:', actionIndex);
            if (actionIndex === 0) {
                // 编辑任务
                this.editTask(this.currentEditingTaskIndex);
            } else if (actionIndex === 1) {
                // 显示打扰历史
                this.showDisturbanceHistoryForTask(this.currentEditingTaskIndex);
            }
        },

        editTask(index) {
            // 原有的编辑任务逻辑
            this.editingTaskIndex = index;
            const task = this.tasks[index];
            this.newTaskName = task.title;
            this.estimatedPomodoros = task.totalCount;
            this.noteContent = task.note || '';
            this.showAddTaskModal = true;
        },

        showDisturbanceHistoryForTask(index) {
            const task = this.tasks[index];
            this.currentTaskDisturbanceHistory = this.pauseHistory.filter(item => item.taskIndex === index);
            this.showDisturbanceHistory = true;
        },

        closeDisturbanceHistory() {
            this.showDisturbanceHistory = false;
            this.currentTaskDisturbanceHistory = [];
        },

        formatDate(dateString) {
            const date = new Date(dateString);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        },

        updateTimerStatus() {
            // 计算预计完成时间和剩余时间
            const now = new Date();
            const finishTime = new Date(now.getTime() + this.time * 1000);
            this.finishTime = `${finishTime.getHours()}:${finishTime.getMinutes().toString().padStart(2, '0')}`;
            this.remainingTime = `${Math.ceil(this.time / 60 / 60)}h`;
            this.totalPomos = this.tasks.reduce((sum, task) => sum + task.totalCount, 0);
            this.$forceUpdate();
        },
        updateBackgroundColor(color) {
            this.bgColor = color;
        },
        onEstimatedPomodorosChange(value) {
            this.estimatedPomodoros = value;
        },
        nextSession() {
            this.resetTimer() // 先停止并复原当前状态的倒计时

            if (this.currentTab === 0) { // 当前是专注状态
                this.sessionCount++ // 增加番茄钟计数
                console.log('番茄钟计数:', this.sessionCount)

                // 停止背景音乐
                this.stopBackgroundMusic()

                // 只有在有未完成的任务的情况下才调用 completePomodoro
                if (this.tasks.length > 0 && this.tasks.some(task => !task.completed)) {
                    this.completePomodoro()
                }

                this.completedFocusSessions++
                console.log('completedFocusSessions:', this.completedFocusSessions)
                if (this.completedFocusSessions % 4 === 0) {
                    this.currentTab = 2 // 切换到长休息
                } else {
                    this.currentTab = 1 // 切换到短休息
                }
                this.showCompletionNotification();
            } else { // 当前是休息状态（短休息或长休息）
                this.currentTab = 0 // 切换到专注状态
            }

            this.resetTimer()
            this.updateTheme()
            this.updateTimerStatus()
            this.updateSessionMessage()
            this.setCurrentTask() // 在每次会话结束时重新设置当前任务
        },

        onPickerConfirm(e) {
            console.log('Picker confirmed:', e);
            if (!e.value || e.value.length === 0 || !e.value[0]) {
                console.error('No value selected');
                this.showPicker = false;
                return;
            }
            const selectedOption = e.value[0];
            this.showPicker = false;
            switch (selectedOption.value) {
                case 'clear_finished':
                    this.clearFinishedTasks();
                    break;
                case 'clear_all':
                    this.confirmClearAllTasks();
                    break;
                default:
                    console.error('Unknown option:', selectedOption);
            }
        },

        confirmClearAllTasks() {
            console.log('Confirming clear all tasks');  // 添加日志
            uni.showModal({
                title: '确认清除',
                content: '确定要清除所有任务吗？此操作不可撤销。',
                confirmText: '确定',
                cancelText: '取消',
                success: (res) => {
                    if (res.confirm) {
                        this.clearAllTasks();
                    } else if (res.cancel) {
                        console.log('用户取消清除所有任务');
                    }
                }
            });
        },

        handleOptionSelect(value) {
            console.log('Handling option:', value);
            switch (value) {
                case 'clear_finished':
                    this.clearFinishedTasks();
                    break;
                case 'clear_all':
                    this.clearAllTasks();
                    break;
                default:
                    console.error('Unknown option:', value);
            }
        },
        clearFinishedTasks() {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveTasks();
            this.updateTaskStatus();
            this.$u.toast('完成的任务已清除！')
        },
        clearAllTasks() {
            console.log('Clearing all tasks');  // 添加日志
            // 清空本地存储中的所有任务
            uni.setStorageSync('tasks', []);

            // 更新 tasks 数组
            this.tasks = [];

            // 更新界面展示
            this.updateTaskStatus();

            this.$u.toast('所有任务已清除！');
        },
        startDragTask(index, event) {
            this.draggedTask = index;
            this.originalIndex = index;
            this.dragStartY = event.touches[0].clientY;
        },

        onDragTask(event) {
            if (this.draggedTask === null) return;

            const currentY = event.touches[0].clientY;
            const deltaY = currentY - this.dragStartY;
            const taskHeight = 60; // 假设每个任务项的高度为60px，您可能需要根据实际情况调整

            let newIndex = this.originalIndex + Math.round(deltaY / taskHeight);
            newIndex = Math.max(0, Math.min(newIndex, this.tasks.length - 1));

            if (newIndex !== this.draggedTask) {
                const [movedTask] = this.tasks.splice(this.draggedTask, 1);
                this.tasks.splice(newIndex, 0, movedTask);
                this.draggedTask = newIndex;
            }
        },

        endDragTask() {
            this.draggedTask = null;
            this.originalIndex = null;
            this.dragStartY = 0;
            this.saveTasks(); // 保存更新后的任务顺序
        },
        preloadAudio() {
            this.notificationAudio = uni.createInnerAudioContext();
            this.notificationAudio.src = '/static/audio/alarm-wood.mp3';
            this.notificationAudio.onError((res) => {
                console.error('音频加载错误:', res.errMsg);
            });
        },
        closePauseReasonModal() {
            this.showPauseReasonModal = false;
            this.pauseReason = '';
            this.toggleTimer(); // 恢复计时器
        },

        recordPauseReason() {
            if (this.pauseReason && this.pauseReason.trim() !== '') {
                const pauseEvent = {
                    taskIndex: this.currentTaskIndex,
                    timestamp: new Date().toISOString(),
                    reason: this.pauseReason
                };
                this.pauseHistory.push(pauseEvent);
                this.savePauseHistory();
            }
            this.closePauseReasonModal();
        },

        savePauseHistory() {
            console.log(this.pauseHistory)
            uni.setStorage({
                key: 'pauseHistory',
                data: JSON.stringify(this.pauseHistory),
                success: () => {
                    console.log('暂停历史已保存到本地存储');
                },
                fail: (err) => {
                    console.error('保存暂停历史失败:', err);
                }
            });
        },

        loadPauseHistory() {
            uni.getStorage({
                key: 'pauseHistory',
                success: (res) => {
                    try {
                        this.pauseHistory = JSON.parse(res.data) || [];
                    } catch (error) {
                        console.error('解析暂停历史数据时出错:', error);
                        this.pauseHistory = [];
                    }
                },
                fail: (err) => {
                    console.error('加载暂停历史失败:', err);
                    this.pauseHistory = [];
                }
            });
        },

        deleteDisturbanceHistory(index) {
            console.log('deleteDisturbanceHistory:', index)
            // 从当前任务的打扰历史中删除
            // 从 pauseHistory 中删除当前选择项
            this.pauseHistory = this.pauseHistory.filter((item, idx) => idx !== index);
            console.log('pauseHistory:', this.pauseHistory)
            // 更新当前任务的打扰历史
            this.currentTaskDisturbanceHistory = this.pauseHistory.filter(item => item.taskIndex === this.currentTaskIndex);
            console.log('currentTaskDisturbanceHistory:', this.currentTaskDisturbanceHistory)
            // 更新全局的 pauseHistory
            this.pauseHistory = this.pauseHistory.filter((item, idx) => {
                return !(item.taskIndex === this.currentTaskIndex && idx === index);
            });
            console.log('pauseHistory:', this.pauseHistory)

            // 保存更新后的打扰历史到本地存储
            this.savePauseHistory();

            this.$u.toast('打扰历史已删除');
        },
        convertToTask(item) {
            const newTask = {
                id: Date.now(), // 简单的唯一ID生成方式
                title: item.reason,
                completed: false,
                completedCount: 0,
                totalCount: 1,
                note: '',
            };
            this.tasks.push(newTask);
        },
        checkIsPc() {
            // 使用 uni.getSystemInfo 来获取设备信息
            uni.getSystemInfo({
                success: (res) => {
                    // 如果平台是 'windows' 或 'mac'，则认为是 PC
                    this.isPc = ['windows', 'mac'].includes(res.platform);
                }
            });
        }
    },
    async mounted() {
        this.updateTheme();
        this.loadTasks();
        this.$nextTick(() => {
            console.log('DOM 更新后的任务:', this.tasks);
        });
        this.updateTaskStatus(); // 初始化状态
        this.updateSessionMessage();
        console.log('mounted 钩子中的任务:', this.tasks);
        await this.initBackgroundMusic(); // 在组件挂载时初始化背景音乐
        this.preloadAudio();
        this.loadPauseHistory();
        this.checkIsPc();
    },
    watch: {
        tasks: {
            handler() {
                this.updateSessionMessage();
            },
            deep: true
        },
        currentTab() {
            this.updateSessionMessage();
        },
        bgColor: {
            immediate: true,
            handler(newValue) {
                document.documentElement.style.setProperty('--bg-color', newValue);
            }
        }
    },
    beforeDestroy() {
        if (this.audioSource) {
            this.audioSource.stop();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.notificationAudio) {
            this.notificationAudio.destroy();
        }
        // 确保在组件销毁时关闭屏幕常亮
        uni.setKeepScreenOn({
            keepScreenOn: false
        });
    },
    provide() {
        return {
            bgColor: this.bgColor
        };
    },
}