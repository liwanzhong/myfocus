<template>
  <view class="page-wrapper" :style="{ backgroundColor: bgColor }">
    <view class="content-container">
      <view class="navbar-wrapper">
        <u-navbar :bgColor="bgColor" title="myfocus" titleStyle="color: #fff; font-weight: bold;"
          :safeAreaInsetTop="true" fixed :placeholder="true">
          <view class="u-nav-slot" slot="left"></view>
          <view class="u-nav-slot" slot="right">
          </view>
        </u-navbar>
      </view>

      <view class="container" :style="{ backgroundColor: bgColor }">
        <view class="timer-container">
          <view class="timer-header">
            <u-tabs :list="tabsList" :current="currentTab" @click="onTabChange" :duration="800" lineColor="#fff"
              activeStyle="color: #ffffff; font-weight: bold;font-size: 20px;"
              inactiveStyle="color: #ffffff;font-weight: bold;font-size: 16px;">
            </u-tabs>
            <view class="icon-group">
              <view class="icon-wrapper">
                <u-icon name="eye" color="#fff" size="30" :bold="true" @click="openFullscreenFocus"></u-icon>
              </view>
              <view class="icon-wrapper">
                <u-icon name="info-circle" color="#fff" size="30" :bold="true" @click="openBestPracticesGuide"></u-icon>
              </view>
              <!-- #ifdef MP-WEIXIN -->
              <view class="icon-wrapper">
                <button open-type="contact" class="contact-button">
                  <u-icon name="server-man" color="#fff" size="30" :bold="true"></u-icon>
                </button>
              </view>
              <!-- #endif -->
            </view>
          </view>

          <view class="timer">
            <text class="time">{{ formattedTime }}</text>
          </view>

          <view class="button-row">
            <u-button :text="timerRunning ? '暂  停' : '开  始'" @click="handleTimerToggle" :customStyle="{
              backgroundColor: '#ffffff',
              color: bgColor,
              marginRight: '20rpx',
              borderRadius: '100rpx',
              border: 'none',
              fontSize: '32rpx',
              fontWeight: 'bold',
              padding: '20rpx 40rpx'
            }"></u-button>
            <u-button v-if="timerRunning" icon="arrow-right" @click="nextSession" :customStyle="{
              backgroundColor: '#ffffff',
              color: bgColor,
              borderRadius: '100rpx',
              border: 'none',
              fontSize: '32rpx',
              fontWeight: 'bold',
              padding: '20rpx 40rpx'
            }"></u-button>
          </view>

          <view class="session-info" @click="confirmResetSession">
            <text style="color: #e0e0e0;">#{{ sessionCount }}</text>
            <br>
            <text>{{ sessionMessage }}</text>
          </view>
        </view>

        <view class="tasks-container">
          <view class="tasks-header">
            <text class="tasks-title">任务</text>
            <u-icon name="more-dot-fill" color="#000" size="30" :bold="true" style="margin-left: auto;"
              @click="showPicker = true"></u-icon>
          </view>
          <u-picker :show="showPicker" :columns="[options]" @confirm="onPickerConfirm" @cancel="showPicker = false"
            :closeOnClickOverlay="true" @close="showPicker = false"></u-picker>
          <view v-if="tasks.length === 0" class="no-tasks">
            <text>还没有任务哦，快来添加吧！</text>
          </view>
          <view v-else>
            <view v-for="(task, index) in tasks" :key="task.id" class="task-item"
              :class="{ 'dragging': draggedTask === index, 'completed': task.completed }"
              @touchstart="startDragTask(index, $event)" @touchmove="onDragTask($event)" @touchend="endDragTask">
              <view class="task-header">
                <u-checkbox-group>
                  <u-checkbox :name="index" shape="square" :checked="task.completed"
                    @change="onTaskCompletionChange(index)" size="35">
                    {{ task.title }}
                  </u-checkbox>
                </u-checkbox-group>
                <text class="task-title" :class="{ 'completed-text': task.completed }">{{ task.title }}</text>
                <text class="task-count">{{ task.completedCount }}/{{ task.totalCount }}</text>
                <u-icon name="more-dot-fill" color="#999" size="25" @tap.native.stop="showTaskOptions(index)"></u-icon>
              </view>
              <view v-if="task.note" class="task-note">
                {{ task.note }}
              </view>
            </view>
          </view>
          <view class="add-task" @click="openNewTaskModal">
            <u-icon name="plus" color="#999" size="25"></u-icon>
            <text> 添加要专注的任务</text>
          </view>
        </view>

        <!-- 新增的任务添加模态框 -->
        <u-popup :show="showAddTaskModal" mode="center" :maskCloseAble="false"
          :customStyle="{ borderRadius: '20rpx', overflow: 'hidden' }">
          <view class="add-task-modal">
            <view class="modal-header">
              <text class="modal-title">{{ editingTaskIndex !== null ? '编辑任务' : '添加任务' }}</text>
              <u-icon name="close" @click="closeTaskModal" size="24"></u-icon>
            </view>
            <input class="task-input" v-model="newTaskName" placeholder="你想专注做什么呢?" />
            <view class="est-pomodoros">
              <text>预估番茄个数</text>
              <view class="pomodoro-counter">
                <u-number-box v-model="estimatedPomodoros" :min="1" :max="99"
                  @change="onEstimatedPomodorosChange"></u-number-box>
              </view>
            </view>
            <view class="add-options">
              <u--textarea v-model="noteContent" placeholder="添加备注" :maxlength="100" autoHeight></u--textarea>
            </view>
            <view class="modal-footer">
              <view class="left-button">
                <u-button v-if="editingTaskIndex !== null" text="删除" @click="deleteTask" type="text" shape="circle"
                  size="large" class="delete-button"></u-button>
              </view>
              <view class="right-buttons">
                <u-button text="取消" @click="closeTaskModal" type="text" shape="circle" size="large"
                  class="cancel-button"></u-button>
                <u-button :text="editingTaskIndex !== null ? '保存' : '添加'" @click="saveTask" shape="round" size="large"
                  class="custom-button">
                </u-button>
              </view>
            </view>
          </view>
        </u-popup>
        <view v-if="tasks.length > 0" class="timer-status-card">
          <view class="status-item">
            <text class="status-label">番茄:</text>
            <text class="status-value">{{ completedPomos }}/{{ totalPomosComputed }}</text>
          </view>
          <view class="status-item">
            <text class="status-label">完成时间:</text>
            <text class="status-value">{{ estimatedFinishTime }} ({{ remainingTimeForAllTasks }})</text>
          </view>
        </view>
        <u-popup :show="showFullscreenFocus" mode="center" :closeable="false" @close="closeFullscreenFocus"
          :customStyle="{ width: '100%', height: '100%', backgroundColor: bgColor }">
          <view class="fullscreen-focus">
            <u-icon name="close" color="#fff" size="30" @click="closeFullscreenFocus"
              class="custom-close-icon"></u-icon>
            <view class="focus-timer">
              <text class="focus-time">{{ formattedTime }}</text>
            </view>
            <view class="focus-task-info">
              <text class="focus-session-count">#{{ sessionCount }}</text>
              <text class="focus-task-name">{{ currentSessionMessage }}</text>
            </view>
            <view class="focus-buttons">
              <u-button :text="timerRunning ? '暂  停' : '开  始'" @click="handleTimerToggle" :customStyle="{
                backgroundColor: '#fff',
                color: bgColor,
                fontSize: '40rpx',
                fontWeight: 'bold',
                padding: '30rpx 60rpx',
                border: 'none',
                minWidth: '200rpx'
              }"></u-button>
              <u-button v-if="timerRunning" icon="arrow-right" @click="nextSession" :customStyle="{
                backgroundColor: '#fff',
                color: bgColor,
                fontSize: '40rpx',
                fontWeight: 'bold',
                padding: '30rpx 60rpx',
                border: 'none',
                minWidth: '200rpx'
              }"></u-button>
            </view>
          </view>
        </u-popup>

        <!-- 暂停原因输入弹窗 (保持在全屏弹窗之外) -->
        <u-popup :show="showPauseReasonModal" mode="center" :closeable="false" @close="closePauseReasonModal"
          :customStyle="{ borderRadius: '20rpx', overflow: 'hidden' }">
          <view class="pause-reason-modal">
            <view class="modal-header">
              <text class="modal-title">暂停原因</text>
            </view>
            <input class="reason-input" v-model="pauseReason" placeholder="请输入暂停原因（选填）" />
            <view class="modal-footer">
              <u-button text="取消" @click="closePauseReasonModal" type="info" shape="circle" size="medium"
                style="margin-right: 20rpx; background-color: #ffffff !important;" plain></u-button>
              <u-button text="记录" @click="recordPauseReason" shape="circle" size="medium"
                style="background-color: #ffffff !important;" plain></u-button>
            </view>
          </view>
        </u-popup>
      </view>
      <!-- 声明部分 -->
      <view class="disclaimer-section">
        <view class="disclaimer-header">
          <text class="disclaimer-title">声明</text>
        </view>
        <view class="disclaimer-content">
          <text>1.任务数据仅存储在当前设备，不可跨设备共享，请注意数据管理；</text>
          <text>2.应用持续优化中，欢迎通过计时器页面的联系图标反馈建议，助力完善。</text>
        </view>
      </view>
    </view>
    <!-- 最佳实践指南弹出层 -->
    <u-popup :show="showBestPracticesGuide" mode="center" :closeable="true" @close="closeBestPracticesGuide"
      :customStyle="{ width: '90%', height: '90%', maxWidth: '600px', maxHeight: '80vh', overflow: 'hidden' }">
      <view class="best-practices-guide">
        <text class="guide-title">番茄钟最佳实践指南</text>
        <scroll-view scroll-y class="guide-content">
          <view class="guide-section">
            <text class="section-title">1. 任务规划</text>
            <text>- 每天开始工作前，花5-10分钟规划当天的任务。</text>
            <text>- 将大任务拆分成可在25分钟内完成的小任务。</text>
            <text>- 为每个任务估算所需的番茄钟数量，但不要过于精确，允许有灵活性。</text>
          </view>

          <view class="guide-section">
            <text class="section-title">2. 设置环境</text>
            <text>- 找一个安静、舒适的工作环境。</text>
            <text>- 在开始专注时段前，清理桌面，准备好所需的工具和材料。</text>
            <text>- 将手机设置为勿扰模式，关闭不必要的通知。点击应用的小眼睛图标，可以打开全屏专注模式。</text>
          </view>

          <view class="guide-section">
            <text class="section-title">3. 使用番茄钟</text>
            <text>- 长按要执行的任务，拖动到任务列表的最顶部，点击"开始"按钮。</text>
            <text>- 在25分钟的专注时间内，全身心投入到任务中，不被打扰。</text>
            <text>- 如果突然想到其他事情，快速记录下来，然后继续专注于当前任务。</text>
            <text>- 时间结束时，无论任务是否完成，都要停下来休息。</text>
          </view>

          <view class="guide-section">
            <text class="section-title">4. 休息时间</text>
            <text>- 短休息（5分钟）：站起来活动一下，做些简单的伸展运动，喝点水。</text>
            <text>- 长休息（15分钟）：可以进行更放松的活动，如冥想、听音乐或短暂散步。</text>
            <text>- 避免在休息时间查看工作相关的邮件或消息。</text>
          </view>

          <view class="guide-section">
            <text class="section-title">5. 任务管理</text>
            <text>- 完成一个番茄钟后，在应用中标记任务进度。</text>
            <text>- 如果一个任务比预期花费更多时间，考虑将其拆分或重新评估。</text>
            <text>- 定期回顾已完成的任务，庆祝自己的进步。</text>
          </view>

          <view class="guide-section">
            <text class="section-title">6. 适应和调整</text>
            <text>- 观察自己的工作模式，找出最适合自己的专注时间长度。</text>
            <text>- 如果发现25分钟太短或太长，可以适当调整，但建议保持在20-35分钟之间。</text>
            <text>- 根据自己的精力曲线，安排重要任务在自己最有效率的时间段。</text>
          </view>

          <view class="guide-section">
            <text class="section-title">7. 处理中断</text>
            <text>- 如果必须中断当前的番茄钟，使用应用的"暂停"功能。</text>
            <text>- 处理完紧急事务后，尽快回到之前的任务，重新开始一个番茄钟。</text>
            <text>- 记录中断的原因，以便后续分析和改进工作流程。</text>
          </view>

          <view class="guide-section">
            <text class="section-title">8. 数据分析</text>
            <text>- 定期查看应用提供的统计数据，了解自己的工作模式和效率。</text>
            <text>- 根据完成的番茄钟数量和任务进度，调整每日和每周的工作计划。</text>
            <text>- 注意观察哪些类型的任务往往需要更多或更少的番茄钟，以便更准确地进行任务规划。</text>
          </view>

          <view class="guide-section">
            <text class="section-title">9. 持续改进</text>
            <text>- 每周花些时间反思使用番茄钟的经验，找出可以改进的地方。</text>
            <text>- 尝试不同的背景音乐或白噪音，找出最能帮助自己集中注意力的声音。</text>
            <text>- 逐步增加每天完成的番茄钟数量，但要注意不要过度劳累。</text>
          </view>

          <view class="guide-section">
            <text class="section-title">10. 保持平衡</text>
            <text>- 不要把所有时间都安排满番茄钟，给自己留一些自由时间和缓冲时间。</text>
            <text>- 记得在专注工作和休息之间保持平衡，避免过度疲劳。</text>
            <text>- 将番茄钟技术视为提高效率的工具，而不是压力的来源。</text>
          </view>

        </scroll-view>
      </view>
    </u-popup>

    <view class="safe-area-inset-right" :style="{ backgroundColor: bgColor }"></view>

    <!-- 暂停原因输入弹窗 -->
    <u-popup :show="showPauseReasonModal" mode="center" :closeable="false" @close="closePauseReasonModal"
      :customStyle="{ borderRadius: '20rpx', overflow: 'hidden' }">
      <view class="pause-reason-modal">
        <view class="modal-header">
          <text class="modal-title">暂停原因</text>
        </view>
        <input class="reason-input" v-model="pauseReason" placeholder="请输入暂停原因（选填）" />
        <view class="modal-footer">
          <u-button text="取消" @click="closePauseReasonModal" type="info" shape="circle" size="medium"
            :customStyle="{ marginRight: '20rpx' }"></u-button>
          <u-button text="记录" @click="recordPauseReason" type="primary" shape="circle" size="medium"></u-button>
        </view>
      </view>
    </u-popup>

    <!-- 在任务列表项中修改更多图标部分 -->
    <u-picker :show="showTaskActionSheet" :columns="[taskActions]" @confirm="handleTaskAction"
      @cancel="showTaskActionSheet = false" :closeOnClickOverlay="true" @close="showTaskActionSheet = false"></u-picker>
    <!-- 添加打扰历史弹窗 -->
    <u-popup :show="showDisturbanceHistory" mode="center" :closeable="true" @close="closeDisturbanceHistory"
      :customStyle="{ borderRadius: '20rpx', overflow: 'hidden', width: '80%', maxWidth: '600rpx' }">
      <view class="disturbance-history-modal">
        <view class="modal-header">
          <text class="modal-title">打扰历史</text>
        </view>
        <scroll-view scroll-y class="history-list">
          <view v-for="(item, index) in currentTaskDisturbanceHistory" :key="index" class="history-item"
            style="display: flex; flex-direction: column; align-items: flex-start;">
            <text class="history-reason" style="margin-bottom: 5rpx; text-align: left; flex-grow: 1;">{{ item.reason
              }}</text>
            <text class="history-time" style="margin-bottom: 10rpx; text-align: left; color: #999;">{{
              formatDate(item.timestamp) }}</text>

            <view style="display: flex; justify-content: flex-end;">

              <u-button text="删除" @click="deleteDisturbanceHistory(index)" :customStyle="{

                backgroundColor: '#ffffff',

                color: '#ff4d4f',

                border: 'none',

                borderRadius: '10rpx',

                fontSize: '20rpx',
                padding: '6rpx 12rpx',

                marginRight: '5rpx'

              }"></u-button>
              <u-button text="转为任务" @click="convertToTask(item)" :customStyle="{
                backgroundColor: '#ffffff',

                color: '#1890ff',

                border: 'none',

                borderRadius: '10rpx',
                fontSize: '20rpx',
                padding: '6rpx 12rpx'
              }"></u-button>
            </view>

          </view>
        </scroll-view>
        <view v-if="currentTaskDisturbanceHistory.length === 0" class="no-history">
          <text>暂无打扰记录</text>
        </view>
      </view>
    </u-popup>

  </view>

</template>
<script src="./index.js"></script>

<style lang="scss" src="./index.scss" scoped></style>