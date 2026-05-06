// ====================================================================
// STATE
// ====================================================================
let nodes = [];
let wires = [];
let selectedNode = null;
let ctxTargetNode = null;
let ctxMenuPos = {x:0, y:0};
let draggingNode = null;
let dragOffset = {x:0, y:0};
let isPanning = false;
let panStart = {x:0, y:0};
let panOffset = {x:80, y:60};
let scale = 1;
let wireDrawing = null;
let nodeCounter = 0;
let bagRecording = false;
let currentEditorNode = null;
let currentEditorTab = 'node.py';
let logCount = 0;

// ====================================================================
// NODE TEMPLATES
// ====================================================================
const NODE_TYPES = [
  {
    id:'publisher', label:'Topic Publisher', cat:'Topics', shortcat:'PUB',
    color:'#1a3550', hdrColor:'#1e4a70', dot:'#2a7ab0',
    ports:{
      in:[{id:'data',label:'data in',type:'any',color:'#6688aa'}],
      out:[{id:'topic',label:'/topic out',type:'std_msgs/String',color:'#2a7ab0'}]
    },
    params:[{k:'topic_name',v:'/chatter'},{k:'queue_size',v:'10'},{k:'rate_hz',v:'10'},{k:'msg_type',v:'std_msgs/String'}],
    pkg:'rclpy',
    code:`import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class PublisherNode(Node):
    def __init__(self):
        super().__init__('publisher_node')
        self.pub = self.create_publisher(String, '/chatter', 10)
        self.timer = self.create_timer(0.1, self.timer_cb)
        self.count = 0

    def timer_cb(self):
        msg = String()
        msg.data = f'Hello ROS2! count={self.count}'
        self.pub.publish(msg)
        self.get_logger().info(f'Publishing: {msg.data}')
        self.count += 1

def main(args=None):
    rclpy.init(args=args)
    node = PublisherNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
`
  },
  {
    id:'subscriber', label:'Topic Subscriber', cat:'Topics', shortcat:'SUB',
    color:'#2a1a4a', hdrColor:'#3e2070', dot:'#5a30a0',
    ports:{
      in:[{id:'topic',label:'/topic in',type:'std_msgs/String',color:'#5a30a0'}],
      out:[{id:'data',label:'data out',type:'any',color:'#6688aa'}]
    },
    params:[{k:'topic_name',v:'/chatter'},{k:'queue_size',v:'10'},{k:'msg_type',v:'std_msgs/String'}],
    pkg:'rclpy',
    code:`import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class SubscriberNode(Node):
    def __init__(self):
        super().__init__('subscriber_node')
        self.sub = self.create_subscription(
            String,
            '/chatter',
            self.listener_cb,
            10)
        self.sub  # prevent unused warning

    def listener_cb(self, msg):
        self.get_logger().info(f'Received: {msg.data}')

def main(args=None):
    rclpy.init(args=args)
    node = SubscriberNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
`
  },
  {
    id:'executable', label:'Executable Node', cat:'Packages', shortcat:'EXEC',
    color:'#1a3a1a', hdrColor:'#204a20', dot:'#2e8a2e',
    ports:{
      in:[{id:'params',label:'params',type:'rcl_interfaces/Parameter',color:'#7030a0'}],
      out:[{id:'pub',label:'publisher out',type:'rclpy/Publisher',color:'#2e8a2e'},{id:'srv',label:'service out',type:'rclpy/Service',color:'#2a7a7a'}]
    },
    params:[{k:'package',v:'demo_nodes_py'},{k:'executable',v:'talker'},{k:'name',v:'my_talker'},{k:'namespace',v:'/'}],
    pkg:'ros2 run',
    code:`# Wraps an existing ROS2 executable.
# Configure package/executable in Properties panel.
#
# Equivalent CLI command:
# ros2 run demo_nodes_py talker \\
#   --ros-args -r __name:=my_talker -r __ns:=/
#
# To remap a topic:
#   --ros-args -r /old_topic:=/new_topic
#
# To pass parameters:
#   --ros-args -p param_name:=value
`
  },
  {
    id:'service_server', label:'Service Server', cat:'Services', shortcat:'SRV',
    color:'#1a3535', hdrColor:'#1e5050', dot:'#2a7a7a',
    ports:{
      in:[{id:'req',label:'request in',type:'srv/Request',color:'#2a7a7a'}],
      out:[{id:'res',label:'response out',type:'srv/Response',color:'#2a7a7a'}]
    },
    params:[{k:'service_name',v:'/add_two_ints'},{k:'srv_type',v:'example_interfaces/AddTwoInts'}],
    pkg:'rclpy',
    code:`import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts

class AddTwoIntsServer(Node):
    def __init__(self):
        super().__init__('add_two_ints_server')
        self.srv = self.create_service(
            AddTwoInts,
            '/add_two_ints',
            self.handle_request)
        self.get_logger().info('AddTwoInts service ready.')

    def handle_request(self, request, response):
        response.sum = request.a + request.b
        self.get_logger().info(
            f'Incoming request: {request.a} + {request.b} = {response.sum}')
        return response

def main(args=None):
    rclpy.init(args=args)
    node = AddTwoIntsServer()
    rclpy.spin(node)
    rclpy.shutdown()
`
  },
  {
    id:'service_client', label:'Service Client', cat:'Services', shortcat:'CLI',
    color:'#301545', hdrColor:'#401a5a', dot:'#7030a0',
    ports:{
      in:[{id:'trigger',label:'trigger',type:'any',color:'#6688aa'}],
      out:[{id:'result',label:'result out',type:'srv/Response',color:'#7030a0'}]
    },
    params:[{k:'service_name',v:'/add_two_ints'},{k:'srv_type',v:'example_interfaces/AddTwoInts'},{k:'a',v:'3'},{k:'b',v:'5'}],
    pkg:'rclpy',
    code:`import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts

class AddTwoIntsClient(Node):
    def __init__(self):
        super().__init__('add_two_ints_client')
        self.cli = self.create_client(AddTwoInts, '/add_two_ints')
        while not self.cli.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('Service not available, waiting...')
        self.send_request(3, 5)

    def send_request(self, a, b):
        req = AddTwoInts.Request()
        req.a = a
        req.b = b
        future = self.cli.call_async(req)
        rclpy.spin_until_future_complete(self, future)
        result = future.result()
        self.get_logger().info(f'Result: {a} + {b} = {result.sum}')

def main(args=None):
    rclpy.init(args=args)
    node = AddTwoIntsClient()
    rclpy.shutdown()
`
  },
  {
    id:'action_server', label:'Action Server', cat:'Actions', shortcat:'ACT',
    color:'#353518', hdrColor:'#4a4a1e', dot:'#8a8a20',
    ports:{
      in:[{id:'goal',label:'goal in',type:'action/Goal',color:'#8a8a20'}],
      out:[{id:'result',label:'result',type:'action/Result',color:'#8a8a20'},{id:'feedback',label:'feedback',type:'action/Feedback',color:'#555555'}]
    },
    params:[{k:'action_name',v:'/fibonacci'},{k:'action_type',v:'example_interfaces/action/Fibonacci'}],
    pkg:'rclpy',
    code:`import rclpy
from rclpy.node import Node
from rclpy.action import ActionServer
from example_interfaces.action import Fibonacci

class FibonacciActionServer(Node):
    def __init__(self):
        super().__init__('fibonacci_action_server')
        self._action_server = ActionServer(
            self,
            Fibonacci,
            '/fibonacci',
            self.execute_callback)

    async def execute_callback(self, goal_handle):
        self.get_logger().info('Executing goal...')
        feedback_msg = Fibonacci.Feedback()
        feedback_msg.partial_sequence = [0, 1]

        for i in range(1, goal_handle.request.order):
            feedback_msg.partial_sequence.append(
                feedback_msg.partial_sequence[i] +
                feedback_msg.partial_sequence[i-1])
            goal_handle.publish_feedback(feedback_msg)

        goal_handle.succeed()
        result = Fibonacci.Result()
        result.sequence = feedback_msg.partial_sequence
        return result

def main(args=None):
    rclpy.init(args=args)
    node = FibonacciActionServer()
    rclpy.spin(node)
`
  },
  {
    id:'action_client', label:'Action Client', cat:'Actions', shortcat:'ACLI',
    color:'#2a2010', hdrColor:'#3a3015', dot:'#a06010',
    ports:{
      in:[{id:'trigger',label:'trigger',type:'any',color:'#6688aa'}],
      out:[{id:'result',label:'result',type:'action/Result',color:'#a06010'}]
    },
    params:[{k:'action_name',v:'/fibonacci'},{k:'order',v:'10'}],
    pkg:'rclpy',
    code:`import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from example_interfaces.action import Fibonacci

class FibonacciActionClient(Node):
    def __init__(self):
        super().__init__('fibonacci_action_client')
        self._client = ActionClient(self, Fibonacci, '/fibonacci')

    def send_goal(self, order):
        self._client.wait_for_server()
        goal_msg = Fibonacci.Goal()
        goal_msg.order = order
        self._send_goal_future = self._client.send_goal_async(
            goal_msg, feedback_callback=self.feedback_callback)
        self._send_goal_future.add_done_callback(self.goal_response_callback)

    def feedback_callback(self, feedback_msg):
        feedback = feedback_msg.feedback
        self.get_logger().info(f'Partial: {feedback.partial_sequence}')

    def goal_response_callback(self, future):
        goal_handle = future.result()
        result_future = goal_handle.get_result_async()
        result_future.add_done_callback(self.get_result_callback)

    def get_result_callback(self, future):
        result = future.result().result
        self.get_logger().info(f'Result: {result.sequence}')
        rclpy.shutdown()
`
  },
  {
    id:'launch', label:'Launch File', cat:'Launch', shortcat:'LAUNCH',
    color:'#2a2a2a', hdrColor:'#353535', dot:'#666666',
    ports:{
      in:[],
      out:[{id:'nodes',label:'nodes out',type:'rclpy/Node[]',color:'#666666'}]
    },
    params:[{k:'package',v:'nav2_bringup'},{k:'file',v:'bringup.launch.py'},{k:'use_sim_time',v:'true'}],
    pkg:'ros2 launch',
    code:`# Generated launch file
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node

def generate_launch_description():
    use_sim_time = LaunchConfiguration('use_sim_time', default='true')

    return LaunchDescription([
        DeclareLaunchArgument(
            'use_sim_time',
            default_value='true',
            description='Use simulation (Gazebo) clock if true'),

        Node(
            package='demo_nodes_py',
            executable='talker',
            name='talker',
            parameters=[{'use_sim_time': use_sim_time}]
        ),
        Node(
            package='demo_nodes_py',
            executable='listener',
            name='listener',
            parameters=[{'use_sim_time': use_sim_time}]
        ),
    ])
`
  },
  {
    id:'parameter', label:'Parameter Node', cat:'Config', shortcat:'PARAM',
    color:'#2a1535', hdrColor:'#38185a', dot:'#7030a0',
    ports:{
      in:[],
      out:[{id:'params',label:'params out',type:'rcl_interfaces/Parameter',color:'#7030a0'}]
    },
    params:[{k:'use_sim_time',v:'false'},{k:'robot_name',v:'myrobot'},{k:'max_vel',v:'0.5'},{k:'loop_rate',v:'10.0'}],
    pkg:'rclpy',
    code:`import rclpy
from rclpy.node import Node

class ParameterNode(Node):
    def __init__(self):
        super().__init__('parameter_node')
        # Declare parameters with defaults
        self.declare_parameter('robot_name', 'myrobot')
        self.declare_parameter('max_vel', 0.5)
        self.declare_parameter('use_sim_time', False)
        self.declare_parameter('loop_rate', 10.0)

        # Read and log
        name = self.get_parameter('robot_name').get_parameter_value().string_value
        vel = self.get_parameter('max_vel').get_parameter_value().double_value
        self.get_logger().info(f'Robot: {name}, max_vel: {vel}')

        # Add parameter callback
        self.add_on_set_parameters_callback(self.params_callback)

    def params_callback(self, params):
        from rcl_interfaces.msg import SetParametersResult
        for p in params:
            self.get_logger().info(f'Param changed: {p.name} = {p.value}')
        return SetParametersResult(successful=True)

def main(args=None):
    rclpy.init(args=args)
    node = ParameterNode()
    rclpy.spin(node)
    rclpy.shutdown()
`
  },
  {
    id:'custom', label:'Custom Node', cat:'Custom', shortcat:'CUSTOM',
    color:'#3a1515', hdrColor:'#501818', dot:'#a03030',
    ports:{
      in:[{id:'in1',label:'input_1',type:'any',color:'#6688aa'},{id:'in2',label:'input_2',type:'any',color:'#6688aa'}],
      out:[{id:'out1',label:'output_1',type:'any',color:'#a03030'}]
    },
    params:[{k:'name',v:'custom_node'},{k:'namespace',v:'/'},{k:'rate_hz',v:'10'}],
    pkg:'rclpy',
    code:`import rclpy
from rclpy.node import Node

class CustomNode(Node):
    """
    Custom ROS2 node — edit this freely.
    Add publishers, subscribers, services, timers, etc.
    """
    def __init__(self):
        super().__init__('custom_node')
        self.get_logger().info('CustomNode initialized!')

        self.timer = self.create_timer(0.1, self.timer_callback)

    def timer_callback(self):
        pass

def main(args=None):
    rclpy.init(args=args)
    node = CustomNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
`
  },
  {
    id:'transform', label:'TF2 Broadcaster', cat:'TF', shortcat:'TF',
    color:'#1a2535', hdrColor:'#1e3050', dot:'#306090',
    ports:{
      in:[{id:'pose',label:'pose in',type:'geometry_msgs/PoseStamped',color:'#e05050'}],
      out:[{id:'tf',label:'tf out',type:'tf2_msgs/TFMessage',color:'#306090'}]
    },
    params:[{k:'parent_frame',v:'world'},{k:'child_frame',v:'base_link'}],
    pkg:'tf2_ros',
    code:`import rclpy
from rclpy.node import Node
from tf2_ros import TransformBroadcaster
from geometry_msgs.msg import TransformStamped
import math

class TF2BroadcasterNode(Node):
    def __init__(self):
        super().__init__('tf2_broadcaster')
        self.tf_broadcaster = TransformBroadcaster(self)
        self.timer = self.create_timer(0.05, self.broadcast_timer_callback)

    def broadcast_timer_callback(self):
        t = TransformStamped()
        t.header.stamp = self.get_clock().now().to_msg()
        t.header.frame_id = 'world'
        t.child_frame_id = 'base_link'
        t.transform.translation.x = 0.0
        t.transform.translation.y = 0.0
        t.transform.translation.z = 0.0
        t.transform.rotation.x = 0.0
        t.transform.rotation.y = 0.0
        t.transform.rotation.z = 0.0
        t.transform.rotation.w = 1.0
        self.tf_broadcaster.sendTransform(t)

def main(args=None):
    rclpy.init(args=args)
    node = TF2BroadcasterNode()
    rclpy.spin(node)
    rclpy.shutdown()
`
  },
  {
    id:'sensor_bridge', label:'Sensor Bridge', cat:'Sensors', shortcat:'SENS',
    color:'#152535', hdrColor:'#1a3545', dot:'#2a6a8a',
    ports:{
      in:[],
      out:[{id:'scan',label:'/scan',type:'sensor_msgs/LaserScan',color:'#2aaa6a'},{id:'img',label:'/image',type:'sensor_msgs/Image',color:'#a030c0'}]
    },
    params:[{k:'scan_topic',v:'/scan'},{k:'image_topic',v:'/camera/image_raw'},{k:'device',v:'/dev/ttyUSB0'}],
    pkg:'rclpy',
    code:`import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan, Image
import math

class SensorBridgeNode(Node):
    def __init__(self):
        super().__init__('sensor_bridge')
        self.scan_pub = self.create_publisher(LaserScan, '/scan', 10)
        self.image_pub = self.create_publisher(Image, '/camera/image_raw', 10)
        self.timer = self.create_timer(0.1, self.publish_sensor_data)

    def publish_sensor_data(self):
        scan = LaserScan()
        scan.header.stamp = self.get_clock().now().to_msg()
        scan.header.frame_id = 'laser_frame'
        scan.angle_min = -math.pi
        scan.angle_max = math.pi
        scan.angle_increment = math.pi / 180.0
        scan.range_min = 0.1
        scan.range_max = 10.0
        scan.ranges = [1.0] * 360
        self.scan_pub.publish(scan)

def main(args=None):
    rclpy.init(args=args)
    node = SensorBridgeNode()
    rclpy.spin(node)
    rclpy.shutdown()
`
  },
];

const WIRE_COLORS = {
  'std_msgs/String':'#3a8ae0','std_msgs/Float64':'#3a8ae0','std_msgs/Int32':'#3a8ae0',
  'sensor_msgs/LaserScan':'#2aaa6a','sensor_msgs/Image':'#a030c0','sensor_msgs/PointCloud2':'#2aaa6a',
  'geometry_msgs/Twist':'#e05050','geometry_msgs/Pose':'#e05050','geometry_msgs/PoseStamped':'#e05050',
  'nav_msgs/OccupancyGrid':'#d4a020','nav_msgs/Path':'#d4a020','nav_msgs/Odometry':'#d4a020',
  'rcl_interfaces/Parameter':'#7030a0','tf2_msgs/TFMessage':'#306090',
  'action/Goal':'#8a8a20','action/Result':'#8a8a20','action/Feedback':'#555',
  'srv/Request':'#2a7a7a','srv/Response':'#2a7a7a',
  'rclpy/Publisher':'#2e8a2e','rclpy/Service':'#2a7a7a','rclpy/Node[]':'#666',
  'any':'#555566',
};

const CODE_TEMPLATES = {
  'CMakeLists.txt':`cmake_minimum_required(VERSION 3.8)
project(my_ros2_package)

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

find_package(ament_cmake REQUIRED)
find_package(rclpy REQUIRED)
find_package(std_msgs REQUIRED)

install(PROGRAMS
  scripts/node.py
  DESTINATION lib/\${PROJECT_NAME}
)

ament_package()
`,
  'package.xml':`<?xml version="1.0"?>
<?xml-model href="http://download.ros.org/schema/package_format3.xsd"
  schematypens="http://www.w3.org/2001/XMLSchema"?>
<package format="3">
  <name>my_ros2_package</name>
  <version>0.0.1</version>
  <description>ROS2 package generated by ROS2 Flow Studio</description>

  <maintainer email="dev@example.com">Developer</maintainer>
  <license>Apache-2.0</license>

  <buildtool_depend>ament_cmake</buildtool_depend>
  <depend>rclpy</depend>
  <depend>std_msgs</depend>
  <depend>sensor_msgs</depend>
  <depend>geometry_msgs</depend>

  <test_depend>ament_lint_auto</test_depend>
  <test_depend>ament_lint_common</test_depend>

  <export>
    <build_type>ament_python</build_type>
  </export>
</package>
`,
  'launch.py':`from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, GroupAction
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node, PushRosNamespace

def generate_launch_description():
    use_sim_time = LaunchConfiguration('use_sim_time', default='false')
    namespace = LaunchConfiguration('namespace', default='')

    return LaunchDescription([
        DeclareLaunchArgument('use_sim_time', default_value='false'),
        DeclareLaunchArgument('namespace', default_value=''),

        Node(
            package='demo_nodes_py',
            executable='talker',
            name='talker',
            parameters=[{'use_sim_time': use_sim_time}],
            remappings=[('/chatter', '/my_chatter')]
        ),
        Node(
            package='demo_nodes_py',
            executable='listener',
            name='listener',
            parameters=[{'use_sim_time': use_sim_time}],
            remappings=[('/chatter', '/my_chatter')]
        ),
    ])
`
};

// ====================================================================
// INIT
// ====================================================================
window.onload = () => {
  buildLibPanel();
  buildAddMenu();
  drawGrid();
  window.addEventListener('resize', drawGrid);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('click', onDocClick);

  const n1 = addNode('executable', {x:100, y:80});
  const n2 = addNode('publisher', {x:360, y:80});
  const n3 = addNode('subscriber', {x:360, y:280});
  const n4 = addNode('parameter', {x:100, y:280});
  const n5 = addNode('service_server', {x:620, y:80});

  setTimeout(() => {
    if(n2&&n3) connectNodes(n2.id,'topic',n3.id,'topic');
    if(n4&&n1) connectNodes(n4.id,'params',n1.id,'params');
    if(n1&&n5) connectNodes(n1.id,'srv',n5.id,'req');
    updateStats();
  }, 150);

  setInterval(fakeLog, 2400);
  fakeLog(); fakeLog(); fakeLog();
  populateTopicMonitor();
  setInterval(updateWires, 200);
  setInterval(updateStats, 3000);
};

// ====================================================================
// GRID
// ====================================================================
function drawGrid() {
  const canvas = document.getElementById('grid-bg');
  const wrap = document.getElementById('canvas-wrap');
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const sm = 20*scale, lg = 100*scale;
  const ox = panOffset.x%sm, oy = panOffset.y%sm;
  ctx.strokeStyle='rgba(255,255,255,0.03)'; ctx.lineWidth=0.5;
  for(let x=ox;x<canvas.width;x+=sm){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
  for(let y=oy;y<canvas.height;y+=sm){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
  ctx.strokeStyle='rgba(255,255,255,0.065)';
  const oxl=panOffset.x%lg, oyl=panOffset.y%lg;
  for(let x=oxl;x<canvas.width;x+=lg){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
  for(let y=oyl;y<canvas.height;y+=lg){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
}

// ====================================================================
// LIB PANEL
// ====================================================================
function buildLibPanel() {
  renderLibItems('');
  document.getElementById('canvas-wrap').ondragover = e => e.preventDefault();
  document.getElementById('canvas-wrap').ondrop = e => {
    e.preventDefault();
    const t = e.dataTransfer.getData('nodeType');
    if(t) addNode(t, screenToCanvas(e.clientX, e.clientY));
  };
}

function renderLibItems(q) {
  const list = document.getElementById('lib-list');
  list.innerHTML = '';
  const cats = [...new Set(NODE_TYPES.map(n=>n.cat))];
  cats.forEach(cat => {
    const items = NODE_TYPES.filter(n=>n.cat===cat && (!q || n.label.toLowerCase().includes(q)));
    if(!items.length) return;
    list.innerHTML += `<div class="lib-category">${cat}</div>`;
    items.forEach(nt => {
      const div = document.createElement('div');
      div.className='lib-item';
      div.setAttribute('data-type', nt.id);
      div.innerHTML=`<div class="lib-dot" style="background:${nt.dot}"></div><span>${nt.label}</span><small>${nt.pkg}</small>`;
      div.draggable=true;
      div.ondragstart=e=>e.dataTransfer.setData('nodeType',nt.id);
      div.ondblclick=()=>addNodeAtCenter(nt.id);
      list.appendChild(div);
    });
  });
}

function filterLib(q) { renderLibItems(q.toLowerCase()); }

// ====================================================================
// ADD MENU
// ====================================================================
let addMenuCanvasPos = {x:0,y:0};

function buildAddMenu() { renderAddItems(''); }

function renderAddItems(q) {
  const list = document.getElementById('add-menu-list');
  list.innerHTML = '';
  const cats = [...new Set(NODE_TYPES.map(n=>n.cat))];
  cats.forEach(cat => {
    const items = NODE_TYPES.filter(n=>n.cat===cat && (!q||n.label.toLowerCase().includes(q)));
    if(!items.length) return;
    list.innerHTML += `<div class="add-category">${cat}</div>`;
    items.forEach(nt => {
      const div = document.createElement('div');
      div.className='add-item';
      div.innerHTML=`<div class="add-dot" style="background:${nt.dot}"></div><span class="add-item-name">${nt.label}</span><span class="add-item-pkg">${nt.pkg}</span>`;
      div.onclick=()=>{ addNode(nt.id, addMenuCanvasPos); closeAddMenu(); };
      list.appendChild(div);
    });
  });
}

function filterAddMenu(q) { renderAddItems(q.toLowerCase()); }

function showAddMenu(sx, sy) {
  addMenuCanvasPos = screenToCanvas(sx, sy);
  const m = document.getElementById('add-menu');
  m.style.left = Math.min(sx, window.innerWidth-240)+'px';
  m.style.top = Math.min(sy, window.innerHeight-360)+'px';
  m.classList.add('open');
  renderAddItems('');
  document.getElementById('add-search').value='';
  setTimeout(()=>document.getElementById('add-search').focus(), 30);
}

function closeAddMenu() { document.getElementById('add-menu').classList.remove('open'); }

// ====================================================================
// NODE CREATION & RENDERING
// ====================================================================
function addNodeAtCenter(typeId) {
  const wrap = document.getElementById('canvas-wrap');
  addNode(typeId, {x:(wrap.clientWidth/2-panOffset.x)/scale-95, y:(wrap.clientHeight/2-panOffset.y)/scale-60});
}

function addNode(typeId, pos) {
  const tmpl = NODE_TYPES.find(n=>n.id===typeId);
  if(!tmpl) return null;
  const node = {
    id:'node_'+(++nodeCounter), type:typeId,
    label:tmpl.label+' '+nodeCounter,
    x:pos.x, y:pos.y,
    running:false, collapsed:false,
    params:tmpl.params.map(p=>({...p})),
    code:tmpl.code,
    ports:JSON.parse(JSON.stringify(tmpl.ports)),
    color:tmpl.color, hdrColor:tmpl.hdrColor, dot:tmpl.dot, badge:tmpl.shortcat
  };
  nodes.push(node);
  renderNode(node);
  updateStats();
  logMsg(node.label,'Node added to graph','info');
  return node;
}

function renderNode(node) {
  const existing = document.getElementById('node-'+node.id);
  if(existing) existing.remove();

  const el = document.createElement('div');
  el.className='ros-node'+(node.collapsed?' node-collapsed':'');
  el.id='node-'+node.id;
  el.style.left=node.x+'px';
  el.style.top=node.y+'px';
  el.style.background=node.color;
  el.style.borderColor=lighten(node.color,40);

  const hdr = document.createElement('div');
  hdr.className='node-header';
  hdr.style.background=node.hdrColor;
  hdr.innerHTML=`<span class="node-type-badge">${node.badge}</span><span class="node-name">${node.label}</span><span class="node-status"></span><button class="node-collapse-btn" onclick="toggleCollapse('${node.id}')">▾</button>`;
  hdr.onmousedown=e=>startNodeDrag(e,node);
  el.appendChild(hdr);

  const body = document.createElement('div');
  body.className='node-body';
  const ins = node.ports.in||[], outs = node.ports.out||[];
  const rows = Math.max(ins.length, outs.length);
  for(let i=0;i<rows;i++) {
    const row = document.createElement('div');
    row.style.cssText='display:flex;justify-content:space-between;align-items:center;';
    const inPort = ins[i], outPort = outs[i];
    if(inPort) {
      row.innerHTML+=`<div class="port-row in" style="flex:1;display:flex;align-items:center;"><div class="port in" id="port-${node.id}-in-${inPort.id}" data-node="${node.id}" data-port="${inPort.id}" data-dir="in" data-type="${inPort.type}" style="background:${inPort.color};border-color:${inPort.color}" onmousedown="startWire(event,'${node.id}','${inPort.id}','in','${inPort.type}')"></div><span class="port-label">${inPort.label}</span><span class="port-type">${inPort.type.split('/').pop()}</span></div>`;
    } else {
      row.innerHTML+=`<div style="flex:1;min-height:22px;"></div>`;
    }
    if(outPort) {
      row.innerHTML+=`<div class="port-row out" style="flex:1;display:flex;align-items:center;justify-content:flex-end;"><span class="port-type">${outPort.type.split('/').pop()}</span><span class="port-label" style="text-align:right;">${outPort.label}</span><div class="port out" id="port-${node.id}-out-${outPort.id}" data-node="${node.id}" data-port="${outPort.id}" data-dir="out" data-type="${outPort.type}" style="background:${outPort.color};border-color:${outPort.color}" onmousedown="startWire(event,'${node.id}','${outPort.id}','out','${outPort.type}')"></div></div>`;
    } else {
      row.innerHTML+=`<div style="flex:1;min-height:22px;"></div>`;
    }
    body.appendChild(row);
  }

  const hr = document.createElement('hr');
  hr.className='node-divider';
  body.appendChild(hr);
  if(node.params.length>0) {
    const p = node.params[0];
    const pr = document.createElement('div');
    pr.className='node-param-row';
    pr.innerHTML=`<label title="${p.k}">${p.k}</label><input value="${p.v}" title="${p.v}" onchange="updateParam('${node.id}',0,this.value)" onclick="event.stopPropagation()">`;
    body.appendChild(pr);
  }
  el.appendChild(body);

  const ftr = document.createElement('div');
  ftr.className='node-footer';
  ftr.innerHTML=`<button class="node-btn" id="run-btn-${node.id}" onclick="event.stopPropagation();toggleRun('${node.id}')" title="Run/Stop">▶</button><button class="node-btn" onclick="event.stopPropagation();openEditor('${node.id}')" title="Edit Code">⟨/⟩</button><button class="node-btn" onclick="event.stopPropagation();selectNode('${node.id}');showITab('properties')" title="Inspect">⚙</button><button class="node-btn danger" onclick="event.stopPropagation();deleteNode('${node.id}')" title="Delete">✕</button>`;
  el.appendChild(ftr);

  el.onclick=e=>{if(!draggingNode)selectNode(node.id);};
  document.getElementById('canvas').appendChild(el);
}

function lighten(hex, a) {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.min(255,r+a)},${Math.min(255,g+a)},${Math.min(255,b+a)})`;
}

// ====================================================================
// NODE ACTIONS
// ====================================================================
function selectNode(id) {
  document.querySelectorAll('.ros-node').forEach(e=>e.classList.remove('selected'));
  selectedNode = nodes.find(n=>n.id===id)||null;
  if(selectedNode) {
    document.getElementById('node-'+id).classList.add('selected');
    updateInspector(selectedNode);
  }
}

function toggleCollapse(id) {
  const node=nodes.find(n=>n.id===id); if(!node)return;
  node.collapsed=!node.collapsed;
  const el=document.getElementById('node-'+id);
  el.classList.toggle('node-collapsed',node.collapsed);
  el.querySelector('.node-collapse-btn').textContent=node.collapsed?'▸':'▾';
  setTimeout(updateWires,50);
}

function toggleRun(id) {
  const node=nodes.find(n=>n.id===id); if(!node)return;
  node.running=!node.running;
  const el=document.getElementById('node-'+id);
  el.classList.toggle('running',node.running);
  const btn=document.getElementById('run-btn-'+id);
  if(btn) btn.textContent=node.running?'■':'▶';
  logMsg(node.label, node.running?'Node process started':'Node process stopped', node.running?'info':'warn');
  animateNodeWires(id, node.running);
}

function deleteNode(id) {
  const dead=wires.filter(w=>w.fromNode===id||w.toNode===id);
  dead.forEach(w=>{const el=document.getElementById('wire-'+w.id);if(el)el.remove();});
  wires=wires.filter(w=>w.fromNode!==id&&w.toNode!==id);
  nodes=nodes.filter(n=>n.id!==id);
  const el=document.getElementById('node-'+id);if(el)el.remove();
  if(selectedNode&&selectedNode.id===id){selectedNode=null;clearInspector();}
  updateStats();
}

function updateParam(nodeId,idx,val) {
  const node=nodes.find(n=>n.id===nodeId);if(node)node.params[idx].v=val;
}

function duplicateNode(id) {
  const orig=nodes.find(n=>n.id===id);if(!orig)return;
  addNode(orig.type,{x:orig.x+30,y:orig.y+30});
}

function runAll() {
  nodes.forEach(n=>{if(!n.running){n.running=true;document.getElementById('node-'+n.id).classList.add('running');const b=document.getElementById('run-btn-'+n.id);if(b)b.textContent='■';animateNodeWires(n.id,true);}});
  logMsg('system','All nodes started','info');
}
function stopAll() {
  nodes.forEach(n=>{if(n.running){n.running=false;document.getElementById('node-'+n.id).classList.remove('running');const b=document.getElementById('run-btn-'+n.id);if(b)b.textContent='▶';animateNodeWires(n.id,false);}});
  logMsg('system','All nodes stopped','warn');
}

// ====================================================================
// DRAG
// ====================================================================
function startNodeDrag(e, node) {
  if(e.button!==0)return;
  e.stopPropagation();
  draggingNode=node;
  const el=document.getElementById('node-'+node.id);
  const rect=el.getBoundingClientRect();
  dragOffset.x=e.clientX-rect.left;
  dragOffset.y=e.clientY-rect.top;
  selectNode(node.id);
}

// ====================================================================
// WIRES
// ====================================================================
function startWire(e,nodeId,portId,dir,type) {
  e.stopPropagation(); e.preventDefault();
  const portEl=document.getElementById(`port-${nodeId}-${dir}-${portId}`);
  const rect=portEl.getBoundingClientRect();
  const cp=screenToCanvas(rect.left+rect.width/2, rect.top+rect.height/2);
  wireDrawing={fromNode:nodeId,fromPort:portId,fromDir:dir,fromType:type,sx:cp.x,sy:cp.y};
  document.getElementById('wire-preview').style.display='';
}

function connectNodes(fromNodeId,fromPortId,toNodeId,toPortId) {
  if(wires.find(w=>w.fromNode===fromNodeId&&w.fromPort===fromPortId&&w.toNode===toNodeId&&w.toPort===toPortId))return;
  const fn=nodes.find(n=>n.id===fromNodeId);
  const tn=nodes.find(n=>n.id===toNodeId);
  if(!fn||!tn)return;
  const fp=fn.ports.out?.find(p=>p.id===fromPortId)||fn.ports.in?.find(p=>p.id===fromPortId);
  const type=fp?fp.type:'any';
  const wire={id:'wire_'+(++nodeCounter),fromNode:fromNodeId,fromPort:fromPortId,toNode:toNodeId,toPort:toPortId,type,active:false};
  wires.push(wire);
  renderWire(wire);
  logMsg('system',`Connected: ${fn.label} → ${tn.label}`,'info');
  updateStats();
}

function renderWire(wire) {
  const svg=document.getElementById('wires-group');
  const color=WIRE_COLORS[wire.type]||'#555566';
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('class','wire');
  path.setAttribute('id','wire-'+wire.id);
  path.setAttribute('stroke',color);
  path.setAttribute('opacity','0.6');
  path.style.cursor='pointer';
  path.style.pointerEvents='stroke';
  path.onclick=e=>{e.stopPropagation();if(confirm(`Delete connection?\n${wire.type}`)){deleteWire(wire.id);}};
  svg.appendChild(path);
  updateWireShape(wire);
}

function updateWireShape(wire) {
  const fromEl=document.getElementById(`port-${wire.fromNode}-out-${wire.fromPort}`)||document.getElementById(`port-${wire.fromNode}-in-${wire.fromPort}`);
  const toEl=document.getElementById(`port-${wire.toNode}-in-${wire.toPort}`)||document.getElementById(`port-${wire.toNode}-out-${wire.toPort}`);
  const pathEl=document.getElementById('wire-'+wire.id);
  if(!fromEl||!toEl||!pathEl)return;
  const fr=fromEl.getBoundingClientRect();
  const tr=toEl.getBoundingClientRect();
  const fc=screenToCanvas(fr.left+fr.width/2,fr.top+fr.height/2);
  const tc=screenToCanvas(tr.left+tr.width/2,tr.top+tr.height/2);
  const dx=Math.max(60,Math.abs(tc.x-fc.x)*0.5);
  pathEl.setAttribute('d',`M${fc.x},${fc.y} C${fc.x+dx},${fc.y} ${tc.x-dx},${tc.y} ${tc.x},${tc.y}`);
}

function updateWires(){wires.forEach(w=>updateWireShape(w));}

function deleteWire(id){
  wires=wires.filter(w=>w.id!==id);
  const el=document.getElementById('wire-'+id);if(el)el.remove();
  updateStats();
}

function animateNodeWires(nodeId,active){
  wires.filter(w=>w.fromNode===nodeId||w.toNode===nodeId).forEach(w=>{
    w.active=active;
    const el=document.getElementById('wire-'+w.id);
    if(!el)return;
    if(active){el.classList.add('wire-active');el.setAttribute('opacity','1');}
    else{el.classList.remove('wire-active');el.setAttribute('opacity','0.6');}
  });
}

// ====================================================================
// CANVAS EVENTS
// ====================================================================
function canvasMouseDown(e) {
  const isCanvas=e.target===document.getElementById('canvas-wrap')||e.target===document.getElementById('grid-bg');
  if(isCanvas) {
    if(e.button===1||(e.button===0&&e.altKey)){
      isPanning=true;
      panStart={x:e.clientX-panOffset.x,y:e.clientY-panOffset.y};
      document.getElementById('canvas-wrap').classList.add('grabbing');
    } else if(e.button===0){
      selectedNode=null;
      document.querySelectorAll('.ros-node').forEach(el=>el.classList.remove('selected'));
      clearInspector();
      if(wireDrawing){wireDrawing=null;document.getElementById('wire-preview').style.display='none';}
    }
  }
}

function canvasMouseMove(e) {
  if(isPanning){
    panOffset.x=e.clientX-panStart.x; panOffset.y=e.clientY-panStart.y;
    applyTransform(); drawGrid();
  }
  if(draggingNode){
    const wr=document.getElementById('canvas-wrap').getBoundingClientRect();
    draggingNode.x=(e.clientX-wr.left-panOffset.x)/scale-dragOffset.x/scale;
    draggingNode.y=(e.clientY-wr.top-panOffset.y)/scale-dragOffset.y/scale;
    const el=document.getElementById('node-'+draggingNode.id);
    if(el){el.style.left=draggingNode.x+'px';el.style.top=draggingNode.y+'px';}
    updateWires();
  }
  if(wireDrawing){
    const cp=screenToCanvas(e.clientX,e.clientY);
    const sx=wireDrawing.sx,sy=wireDrawing.sy,tx=cp.x,ty=cp.y;
    const dx=Math.max(60,Math.abs(tx-sx)*0.5);
    document.getElementById('wire-preview').setAttribute('d',`M${sx},${sy} C${sx+dx},${sy} ${tx-dx},${ty} ${tx},${ty}`);
  }
}

function canvasMouseUp(e) {
  if(isPanning){isPanning=false;document.getElementById('canvas-wrap').classList.remove('grabbing');}
  if(draggingNode)draggingNode=null;
  if(wireDrawing){
    const el=document.elementFromPoint(e.clientX,e.clientY);
    if(el&&el.classList.contains('port')&&el.dataset.node!==wireDrawing.fromNode){
      const tn=el.dataset.node,tp=el.dataset.port,td=el.dataset.dir;
      if(wireDrawing.fromDir==='out'&&td==='in')connectNodes(wireDrawing.fromNode,wireDrawing.fromPort,tn,tp);
      else if(wireDrawing.fromDir==='in'&&td==='out')connectNodes(tn,tp,wireDrawing.fromNode,wireDrawing.fromPort);
    }
    wireDrawing=null;
    document.getElementById('wire-preview').style.display='none';
  }
}

function canvasWheel(e) {
  e.preventDefault();
  const delta=-e.deltaY*0.0008;
  const ns=Math.max(0.15,Math.min(4,scale*(1+delta)));
  const wr=document.getElementById('canvas-wrap').getBoundingClientRect();
  const mx=e.clientX-wr.left,my=e.clientY-wr.top;
  panOffset.x=mx-(mx-panOffset.x)*(ns/scale);
  panOffset.y=my-(my-panOffset.y)*(ns/scale);
  scale=ns;
  applyTransform(); drawGrid();
}

function applyTransform(){
  document.getElementById('canvas').style.transform=`translate(${panOffset.x}px,${panOffset.y}px) scale(${scale})`;
  document.getElementById('canvas').style.transformOrigin='0 0';
}

function screenToCanvas(sx,sy){
  const wr=document.getElementById('canvas-wrap').getBoundingClientRect();
  return{x:(sx-wr.left-panOffset.x)/scale,y:(sy-wr.top-panOffset.y)/scale};
}

// ====================================================================
// KEYBOARD
// ====================================================================
function onKeyDown(e) {
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(e.key==='a'&&e.shiftKey){
    const wr=document.getElementById('canvas-wrap').getBoundingClientRect();
    showAddMenu(wr.left+wr.width/2,wr.top+wr.height/2);
  }
  if((e.key==='x'||e.key==='Delete')&&selectedNode)deleteNode(selectedNode.id);
  if(e.key==='h'&&selectedNode)toggleCollapse(selectedNode.id);
  if(e.key===' '&&selectedNode){e.preventDefault();toggleRun(selectedNode.id);}
  if(e.key==='d'&&e.ctrlKey&&selectedNode){e.preventDefault();duplicateNode(selectedNode.id);}
  if(e.key==='e'&&selectedNode)openEditor(selectedNode.id);
  if(e.key==='Tab'&&selectedNode){e.preventDefault();showITab('properties');}
  if(e.key==='Escape'){closeAddMenu();closeEditor();document.getElementById('ctx-menu').classList.remove('open');}
}

// ====================================================================
// CONTEXT MENU
// ====================================================================
function showCtxMenu(e) {
  e.preventDefault();
  ctxTargetNode=selectedNode;
  ctxMenuPos={x:e.clientX,y:e.clientY};
  const m=document.getElementById('ctx-menu');
  m.style.left=Math.min(e.clientX,window.innerWidth-160)+'px';
  m.style.top=Math.min(e.clientY,window.innerHeight-220)+'px';
  m.classList.add('open');
}

function onDocClick(e){
  if(!e.target.closest('#ctx-menu'))document.getElementById('ctx-menu').classList.remove('open');
  if(!e.target.closest('#add-menu')&&!e.target.closest('#lib-list'))closeAddMenu();
}

function ctxAction(action){
  document.getElementById('ctx-menu').classList.remove('open');
  if(action==='add')showAddMenu(ctxMenuPos.x,ctxMenuPos.y);
  else if(action==='dup'&&ctxTargetNode)duplicateNode(ctxTargetNode.id);
  else if(action==='code'&&ctxTargetNode)openEditor(ctxTargetNode.id);
  else if(action==='run'&&ctxTargetNode)toggleRun(ctxTargetNode.id);
  else if(action==='collapse'&&ctxTargetNode)toggleCollapse(ctxTargetNode.id);
  else if(action==='inspect'&&ctxTargetNode){selectNode(ctxTargetNode.id);showITab('properties');}
  else if(action==='delete'&&ctxTargetNode)deleteNode(ctxTargetNode.id);
}

// ====================================================================
// INSPECTOR
// ====================================================================
function showITab(tab){
  const tabs=['properties','ports','params','graph'];
  document.querySelectorAll('.itab').forEach((el,i)=>el.classList.toggle('active',tabs[i]===tab));
  document.querySelectorAll('.ipanel').forEach(p=>p.classList.remove('active'));
  document.getElementById('i'+tab).classList.add('active');
}

function clearInspector(){
  document.getElementById('iproperties').innerHTML='<div style="color:var(--text3);font-size:10px;padding:16px 0;text-align:center;line-height:2;">Select a node to inspect<br><span style="font-size:9px;">Double-click library to add nodes</span></div>';
  document.getElementById('iports').innerHTML='';
  document.getElementById('iparams').innerHTML='';
}

function updateInspector(node){
  const tmpl=NODE_TYPES.find(n=>n.id===node.type);
  document.getElementById('iproperties').innerHTML=`
    <div class="isection">${node.badge} — ${node.type}</div>
    <div class="ifield"><label>Node Name</label><input id="insp-name" value="${node.label}" onchange="updateNodeLabel('${node.id}',this.value)"></div>
    <div class="ifield"><label>Package</label><input value="${tmpl.pkg}" readonly style="color:var(--text3)"></div>
    <div class="ifield"><label>Node ID</label><input value="${node.id}" readonly style="color:var(--text3);font-size:9px;"></div>
    <div class="ifield"><label>Status</label><input value="${node.running?'Running ▶':'Stopped ■'}" readonly style="color:${node.running?'#56d364':'#e05050'}"></div>
    <div style="margin-top:10px;">
      <button class="ibtn primary" onclick="openEditor('${node.id}')">⟨/⟩ Edit Code</button>
      <button class="ibtn" onclick="toggleRun('${node.id}')" id="insp-run-btn">${node.running?'■ Stop Node':'▶ Run Node'}</button>
      <button class="ibtn" onclick="duplicateNode('${node.id}')">⧉ Duplicate</button>
      <button class="ibtn danger" onclick="deleteNode('${node.id}')">✕ Delete Node</button>
    </div>
  `;
  const ins=node.ports.in||[],outs=node.ports.out||[];
  document.getElementById('iports').innerHTML=`
    <div class="isection">Inputs (${ins.length})</div>
    ${ins.length?ins.map(p=>`<div class="iport-row"><div class="iport-dot" style="background:${p.color}"></div><span class="iport-name">${p.label}</span><span class="iport-type">${p.type}</span></div>`).join(''):'<div style="font-size:10px;color:var(--text3);padding:4px 0;">No inputs</div>'}
    <div class="isection" style="margin-top:10px;">Outputs (${outs.length})</div>
    ${outs.length?outs.map(p=>`<div class="iport-row"><div class="iport-dot" style="background:${p.color}"></div><span class="iport-name">${p.label}</span><span class="iport-type">${p.type}</span></div>`).join(''):'<div style="font-size:10px;color:var(--text3);padding:4px 0;">No outputs</div>'}
    <div class="isection" style="margin-top:10px;">Add Port</div>
    <div style="display:flex;gap:6px;">
      <button class="ibtn" style="flex:1;" onclick="addPortUI('${node.id}','in')">+ Input Port</button>
      <button class="ibtn" style="flex:1;" onclick="addPortUI('${node.id}','out')">+ Output Port</button>
    </div>
  `;
  document.getElementById('iparams').innerHTML=`
    <div class="isection">ROS2 Parameters (${node.params.length})</div>
    ${node.params.map((p,i)=>`
      <div class="ifield" style="display:flex;gap:4px;margin-bottom:4px;">
        <input value="${p.k}" style="width:90px;flex-shrink:0;" placeholder="key" onchange="nodes.find(n=>n.id==='${node.id}').params[${i}].k=this.value">
        <input value="${p.v}" style="flex:1;" placeholder="value" onchange="nodes.find(n=>n.id==='${node.id}').params[${i}].v=this.value">
        <button style="background:none;border:none;color:var(--text3);cursor:pointer;padding:0 4px;" onclick="removeParam('${node.id}',${i})">✕</button>
      </div>`).join('')}
    <button class="ibtn" style="margin-top:4px;" onclick="addParam('${node.id}')">+ Add Parameter</button>
    <div style="margin-top:8px;font-size:9px;color:var(--text3);">Parameters are passed via --ros-args -p key:=value at launch.</div>
  `;
}

function updateNodeLabel(id, val){
  const node=nodes.find(n=>n.id===id);if(!node)return;
  node.label=val;
  const el=document.getElementById('node-'+id);
  if(el)el.querySelector('.node-name').textContent=val;
}

function addPortUI(nodeId,dir){
  const name=prompt('Port name:',dir==='in'?'new_input':'new_output');if(!name)return;
  const type=prompt('Message type (e.g. std_msgs/String):','std_msgs/String')||'any';
  const node=nodes.find(n=>n.id===nodeId);if(!node)return;
  node.ports[dir].push({id:name.replace(/\s/g,'_'),label:name,type,color:WIRE_COLORS[type]||'#888'});
  renderNode(node);
  updateInspector(node);
  logMsg(node.label,`Port "${name}" (${dir}) added`,'info');
}

function addParam(nodeId){
  const node=nodes.find(n=>n.id===nodeId);if(!node)return;
  node.params.push({k:'new_param',v:'value'});
  updateInspector(node);
}
function removeParam(nodeId,idx){
  const node=nodes.find(n=>n.id===nodeId);if(!node)return;
  node.params.splice(idx,1);
  updateInspector(node);
}

// ====================================================================
// CODE EDITOR
// ====================================================================
function openEditor(nodeId){
  currentEditorNode=nodes.find(n=>n.id===nodeId);if(!currentEditorNode)return;
  currentEditorTab='node.py';
  document.getElementById('editor-node-label').textContent=currentEditorNode.label;
  document.querySelectorAll('.etab').forEach(t=>t.classList.toggle('active',t.textContent==='node.py'));
  document.getElementById('code-textarea').value=currentEditorNode.code;
  document.getElementById('code-editor-wrap').classList.add('open');
  lintCode(currentEditorNode.code);
}

function closeEditor(){document.getElementById('code-editor-wrap').classList.remove('open');}

function switchEditorTab(tab){
  currentEditorTab=tab;
  document.querySelectorAll('.etab').forEach(t=>t.classList.toggle('active',t.textContent===tab));
  if(!currentEditorNode)return;
  const content=tab==='node.py'?currentEditorNode.code:(CODE_TEMPLATES[tab]||`# ${tab}\n# No template for this file type.\n`);
  document.getElementById('code-textarea').value=content;
  lintCode(content);
}

function applyAndReload(){
  if(!currentEditorNode)return;
  if(currentEditorTab==='node.py')currentEditorNode.code=document.getElementById('code-textarea').value;
  if(currentEditorNode.running){toggleRun(currentEditorNode.id);setTimeout(()=>toggleRun(currentEditorNode.id),400);}
  logMsg(currentEditorNode.label,'Code saved and node reloaded','info');
  document.getElementById('lint-status').textContent='✓ Saved';
  document.getElementById('lint-status').className='lint-ok';
  setTimeout(()=>lintCode(document.getElementById('code-textarea').value),1000);
}

function formatCode(){
  const ta=document.getElementById('code-textarea');
  ta.value=ta.value.split('\n').map(l=>l.trimEnd()).join('\n');
}

const SNIPPETS = {
  publisher:`        self.pub = self.create_publisher(String, '/topic', 10)\n        self.timer = self.create_timer(0.1, self.timer_cb)\n\n    def timer_cb(self):\n        msg = String(msg.data = 'hello')\n        self.pub.publish(msg)\n`,
  subscriber:`        self.sub = self.create_subscription(\n            String, '/topic', self.callback, 10)\n\n    def callback(self, msg):\n        self.get_logger().info(f'Got: {msg.data}')\n`,
  service:`        self.srv = self.create_service(AddTwoInts, '/add', self.handle)\n\n    def handle(self, req, res):\n        res.sum = req.a + req.b\n        return res\n`,
  timer:`        self.timer = self.create_timer(1.0, self.timer_cb)\n\n    def timer_cb(self):\n        self.get_logger().info('Tick!')\n`,
};
function insertSnippet(){
  const key=prompt('Insert snippet:\npublisher | subscriber | service | timer','publisher');
  if(key&&SNIPPETS[key]){
    const ta=document.getElementById('code-textarea');
    const pos=ta.selectionStart;
    ta.value=ta.value.slice(0,pos)+SNIPPETS[key]+ta.value.slice(pos);
    lintCode(ta.value);
  }
}

function lintCode(code){
  const issues=[];
  if(code.includes('import rclpy')&&!code.includes('def main'))issues.push('Missing main() function');
  if(code.includes('self.create_publisher')&&!code.includes('from'))issues.push('Missing msg type import');
  if(code.match(/def\s+__init__/)&&!code.includes('super().__init__'))issues.push('Missing super().__init__() call');
  const el=document.getElementById('lint-status');
  if(issues.length===0){el.textContent='✓ No issues';el.className='lint-ok';}
  else{el.textContent=`⚠ ${issues.length} issue${issues.length>1?'s':''}`;el.className='lint-err';el.title=issues.join('\n');}
}

// ====================================================================
// BOTTOM PANEL
// ====================================================================
function showBTab(tab){
  const tabs=['log','topics','terminal','bag'];
  document.querySelectorAll('.btab').forEach((t,i)=>t.classList.toggle('active',tabs[i]===tab));
  document.querySelectorAll('.bpanel').forEach(p=>p.classList.remove('active'));
  document.getElementById('b'+tab).classList.add('active');
}

const FAKE_MSGS=[
  ['Subscribed to /chatter — queue_size=10','info'],
  ['Publishing: Hello ROS2! count=42','info'],
  ['Service call complete: sum=8','info'],
  ['Parameter loaded: max_vel=0.5','info'],
  ['TF published: base_link -> odom','info'],
  ['Action goal accepted (Fibonacci order=10)','info'],
  ['LaserScan received: 360 ranges','info'],
  ['Navigation goal sent to /navigate_to_pose','info'],
  ['Warning: Subscriber queue overflow','warn'],
  ['Connection timeout on /map topic','warn'],
  ['Failed to find service /add_two_ints','err'],
];

function fakeLog(){
  if(!nodes.length)return;
  const node=nodes[Math.floor(Math.random()*nodes.length)];
  const [msg,lvl]=FAKE_MSGS[Math.floor(Math.random()*FAKE_MSGS.length)];
  logMsg(node.label,msg,lvl);
}

function logMsg(nodeName,msg,level='info'){
  const now=new Date();
  const ts=`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
  const panel=document.getElementById('blog');if(!panel)return;
  const row=document.createElement('div');
  row.className=`log-entry${level==='warn'?' warn':level==='err'?' err':''}`;
  row.innerHTML=`<span class="log-time">[${ts}]</span><span class="log-node-name">${nodeName.substring(0,20)}</span><span class="log-msg">${msg}</span>`;
  panel.appendChild(row);
  if(panel.children.length>200)panel.removeChild(panel.firstChild);
  panel.scrollTop=panel.scrollHeight;
  logCount++;
}

function populateTopicMonitor(){
  const topics=[
    {n:'/chatter',t:'std_msgs/String',hz:'10.0 Hz'},
    {n:'/scan',t:'sensor_msgs/LaserScan',hz:'5.0 Hz'},
    {n:'/cmd_vel',t:'geometry_msgs/Twist',hz:'20.0 Hz'},
    {n:'/odom',t:'nav_msgs/Odometry',hz:'50.0 Hz'},
    {n:'/map',t:'nav_msgs/OccupancyGrid',hz:'1.0 Hz'},
    {n:'/camera/image_raw',t:'sensor_msgs/Image',hz:'30.0 Hz'},
    {n:'/tf',t:'tf2_msgs/TFMessage',hz:'100.0 Hz'},
    {n:'/joint_states',t:'sensor_msgs/JointState',hz:'50.0 Hz'},
    {n:'/goal_pose',t:'geometry_msgs/PoseStamped',hz:'—'},
  ];
  const panel=document.getElementById('btopics');
  const header=document.createElement('div');
  header.style.cssText='display:flex;gap:8px;padding:2px 0 4px;border-bottom:1px solid var(--border);margin-bottom:2px;';
  header.innerHTML='<span style="color:var(--text3);width:180px;">Topic</span><span style="color:var(--text3);flex:1;">Type</span><span style="color:var(--text3);width:70px;text-align:right;">Hz</span>';
  panel.appendChild(header);
  topics.forEach(t=>{
    const row=document.createElement('div');
    row.className='topic-row';
    row.innerHTML=`<span class="topic-name">${t.n}</span><span class="topic-type">${t.t}</span><span class="topic-hz">${t.hz}</span>`;
    panel.appendChild(row);
  });
  const bagList=document.getElementById('bag-topic-list');
  topics.forEach(t=>{
    const item=document.createElement('div');
    item.innerHTML=`<label style="display:flex;align-items:center;gap:6px;padding:2px 0;font-size:10px;cursor:pointer;"><input type="checkbox" checked style="margin:0;"><span style="color:var(--accent)">${t.n}</span><span style="color:var(--text3);font-size:9px;">${t.t}</span></label>`;
    bagList.appendChild(item);
  });
}

// ====================================================================
// GRAPH ACTIONS
// ====================================================================
function updateStats(){
  document.getElementById('stat-nodes').value=nodes.length;
  document.getElementById('stat-wires').value=wires.length;
  document.getElementById('stat-topics').value=wires.filter(w=>w.type.includes('msgs')).length;
}

function exportLaunch(){
  exportLaunchToFile();
}

function exportJSON(){
  saveProject(true);
}

function syncLiveGraph(){
  logMsg('system','Querying live ROS2 graph: ros2 node list...','info');
  setTimeout(()=>{
    logMsg('system','ros2 node list returned 3 nodes','info');
    logMsg('system','Sync complete — 0 new nodes added (simulated env)','warn');
  },900);
}

function clearGraph(){
  if(!confirm('Clear all nodes and connections? This cannot be undone.'))return;
  nodes.forEach(n=>{const el=document.getElementById('node-'+n.id);if(el)el.remove();});
  nodes=[];wires=[];
  document.getElementById('wires-group').innerHTML='';
  selectedNode=null;clearInspector();updateStats();
  logMsg('system','Graph cleared','warn');
}

let bagIntervalId=null;
function toggleBag(){
  bagRecording=!bagRecording;
  const btn=document.querySelector('#bbag .ibtn');
  const st=document.getElementById('bag-status');
  if(bagRecording){
    btn.textContent='⏹ Stop Recording';
    st.textContent='Recording — 00:00:00'; st.style.color='#e05050';
    let secs=0;
    bagIntervalId=setInterval(()=>{
      secs++;
      const h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60),s=secs%60;
      st.textContent=`Recording — ${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
      if(secs%5===0)logMsg('bag_recorder',`Wrote ${Math.floor(Math.random()*80+20)} messages to bag`,'info');
    },1000);
  } else {
    btn.textContent='⏺ Record';
    st.textContent='Idle — bag saved'; st.style.color='var(--text3)';
    clearInterval(bagIntervalId);
    logMsg('bag_recorder','Bag recording stopped and saved','info');
  }
}

// ====================================================================
// MENU STUBS
// ====================================================================
function fileMenu(){
  const choice=prompt('File:\n1. New Project\n2. Open .ros2flow\n3. Save Project\n4. Export launch.py\n\nEnter choice:','3');
  if(choice==='1')clearGraph();
  else if(choice==='2')openProject();
  else if(choice==='3')saveProject(false);
  else if(choice==='4')exportLaunchToFile();
}
function editMenu(){logMsg('system','Edit menu — undo/redo/copy/paste (Electron build)','info');}
function viewMenu(){logMsg('system','View menu — zoom/pan/layout (Electron build)','info');}
function rosMenu(){
  const topics=['ros2 node list','ros2 topic list','ros2 service list','ros2 param list','ros2 bag record -a'];
  logMsg('system','ROS menu — common commands:','info');
  topics.forEach(t=>logMsg('ros2',t,'info'));
}

// ====================================================================
// ELECTRON IPC (END)
// ====================================================================
let lastProjectPath = null;
const hasApi = typeof window.api !== 'undefined';

if (hasApi) {
  window.api.onMenuAction(async (action) => {
    if (action === 'new') { clearGraphNoConfirm(); lastProjectPath = null; setProjectTitle('untitled.ros2flow*'); }
    if (action === 'open') await openProject();
    if (action === 'save') await saveProject(false);
    if (action === 'saveAs') await saveProject(true);
    if (action === 'exportLaunch') await exportLaunchToFile();
  });
}

function setProjectTitle(name) {
  const el = document.getElementById('project-name');
  if (el) el.textContent = name;
}

async function openProject() {
  if (!hasApi) return alert('Open only works in Electron.');
  const res = await window.api.openProject();
  if (res?.data) {
    loadProjectData(res.data);
    lastProjectPath = res.filePath;
    setProjectTitle(res.filePath.split(/[\\/]/).pop());
  }
}

async function saveProject(forceSaveAs) {
  if (!hasApi) return alert('Save only works in Electron.');
  const data = getProjectData();
  const res = await window.api.saveProject({ data, filePath: forceSaveAs ? null : lastProjectPath });
  if (res?.filePath) {
    lastProjectPath = res.filePath;
    setProjectTitle(res.filePath.split(/[\\/]/).pop());
  }
}

async function exportLaunchToFile() {
  if (!hasApi) return alert('Export only works in Electron.');
  const content = buildLaunchFile();
  await window.api.exportLaunch({ content });
}

function getProjectData() {
  return { nodes, wires, meta: { ros_distro: 'humble', created: new Date().toISOString() } };
}

function loadProjectData(data) {
  clearGraphNoConfirm();
  nodes = []; wires = []; nodeCounter = 0;
  data.nodes.forEach(n => {
    const node = { ...n, running:false };
    nodes.push(node);
    renderNode(node);
    const num = parseInt(node.id.split('_').pop() || '0', 10);
    nodeCounter = Math.max(nodeCounter, num);
  });
  data.wires.forEach(w => { wires.push(w); renderWire(w); });
  updateStats(); updateWires();
}

function clearGraphNoConfirm() {
  nodes.forEach(n => { const el = document.getElementById('node-' + n.id); if (el) el.remove(); });
  nodes = []; wires = [];
  document.getElementById('wires-group').innerHTML = '';
  selectedNode = null; clearInspector(); updateStats();
}

function buildLaunchFile() {
  const lines = [
    `from launch import LaunchDescription`,
    `from launch.actions import DeclareLaunchArgument`,
    `from launch.substitutions import LaunchConfiguration`,
    `from launch_ros.actions import Node`,
    ``,
    `def generate_launch_description():`,
    `    return LaunchDescription([`,
  ];
  nodes.filter(n => n.type === 'executable' || n.type === 'custom' || n.type === 'publisher' || n.type === 'subscriber')
    .forEach(n => {
      const pkg = n.params.find(p => p.k === 'package')?.v || 'my_package';
      const exe = n.params.find(p => p.k === 'executable')?.v || n.id;
      const nm = n.label.toLowerCase().replace(/\s+/g, '_');
      lines.push(`        Node(package='${pkg}', executable='${exe}', name='${nm}'),`);
    });
  lines.push(`    ])`);
  return lines.join('\n');
}
