import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "sonner";
import api from "@/lib/api";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    const [registerData, setRegisterData] = useState({
        username: "",
        password: "",
        name: "",
        role: "salesperson"
    });

    const {
        setIsAuthenticated,
        setUserRole,
        setUserName
    } = useContext(AuthContext);

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 尝试使用API进行登录
            try {
              const response = await api.auth.login(username, password);
              
              if (response && response.success) {
                setIsAuthenticated(true);
                setUserRole(response.user.role as "admin" | "salesperson");
                setUserName(response.user.name);
                toast.success(`欢迎，${response.user.role === "admin" ? "管理员" : "业务员"}`);
                navigate("/");
                return;
              }
            } catch (error) {
              console.error("登录API失败，尝试使用备用登录方式:", error);
              
              // 备用登录逻辑，直接验证用户名密码
              if (username === 'admin' && password === 'password') {
                // 默认管理员账号
                setIsAuthenticated(true);
                setUserRole('admin');
                setUserName('管理员');
                localStorage.setItem('auth', JSON.stringify({
                  id: 'admin_1',
                  username: 'admin',
                  name: '管理员',
                  role: 'admin'
                }));
                toast.success("欢迎，管理员");
                navigate("/");
                return;
              }
              
              // 业务员账号验证（简化版）
              const salespersonsData = localStorage.getItem('salespersons');
              if (salespersonsData) {
                const salespersons = JSON.parse(salespersonsData);
                const salesperson = salespersons.find((s: any) => s.username === username && s.password === password);
                if (salesperson) {
                  setIsAuthenticated(true);
                  setUserRole('salesperson');
                  setUserName(salesperson.name);
                  localStorage.setItem('auth', JSON.stringify({
                    id: salesperson.id,
                    username: salesperson.username,
                    name: salesperson.name,
                    role: 'salesperson'
                  }));
                  toast.success(`欢迎，${salesperson.name}`);
                  navigate("/");
                  return;
                }
              }
              
              throw new Error('用户名或密码错误');
            }

            // 内部的try-catch已经处理了登录成功的情况
            // 这里不需要再次检查response变量

        } catch (error) {
            console.error("登录失败:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.auth.register(
                registerData.username,
                registerData.password,
                registerData.name,
                registerData.role
            );

            if (response && response.success) {
                if (response.needsApproval) {
                    toast.success("注册成功，等待管理员审核");
                    setShowRegister(false);
                } else {
                    toast.success("注册成功，请登录");
                    setShowRegister(false);
                }
            }
        } catch (error: any) {
            toast.error(error.message || "注册失败");
            console.error("注册失败:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {
            name,
            value
        } = e.target;

        setRegisterData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center p-4">
            <div
                className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">销售订单管理系统</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        {showRegister ? "创建新账户" : "请登录您的账户"}
                    </p>
                </div>
                {!showRegister ? <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">用户名
                                                        </label>
                        <div className="relative">
                            <span
                                className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <i className="fa-solid fa-user"></i>
                            </span>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="请输入用户名"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                                required />
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">密码
                                                        </label>
                        <div className="relative">
                            <span
                                className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <i className="fa-solid fa-lock"></i>
                            </span>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="请输入密码"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                                required />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-xl transition-all flex items-center justify-center ${isLoading ? "opacity-80 cursor-not-allowed" : ""}`}>
                        {isLoading ? <>
                            <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>登录中...
                                                        </> : <>
                            <i className="fa-solid fa-sign-in-alt mr-2"></i>登录
                                                        </>}
                    </button>
                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => setShowRegister(true)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-sm">还没有账号？立即注册
                                                        </button>
                    </div>
                    {process.env.NODE_ENV !== "production" && <></>}
                </form> : <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label
                            htmlFor="reg-username"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">用户名
                                                        </label>
                        <div className="relative">
                            <span
                                className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <i className="fa-solid fa-user"></i>
                            </span>
                            <input
                                type="text"
                                id="reg-username"
                                name="username"
                                value={registerData.username}
                                onChange={handleRegisterChange}
                                placeholder="请输入用户名"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                                required />
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="reg-name"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">姓名
                                                        </label>
                        <div className="relative">
                            <span
                                className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <i className="fa-solid fa-user-tie"></i>
                            </span>
                            <input
                                type="text"
                                id="reg-name"
                                name="name"
                                value={registerData.name}
                                onChange={handleRegisterChange}
                                placeholder="请输入您的姓名"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                                required />
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="reg-role"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">角色
                                                        </label>
                        <div className="relative">
                            <span
                                className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <i className="fa-solid fa-user-gear"></i>
                            </span>
                            <input
                                type="hidden"
                                id="reg-role"
                                name="role"
                                value="salesperson"
                            />
                            <input
                                type="text"
                                value="业务员"
                                disabled
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                            />
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="reg-password"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">密码
                                                        </label>
                        <div className="relative">
                            <span
                                className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <i className="fa-solid fa-lock"></i>
                            </span>
                            <input
                                type="password"
                                id="reg-password"
                                name="password"
                                value={registerData.password}
                                onChange={handleRegisterChange}
                                placeholder="请设置密码"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none"
                                required />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-xl transition-all flex items-center justify-center ${isLoading ? "opacity-80 cursor-not-allowed" : ""}`}>
                        {isLoading ? <>
                            <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>注册中...
                                                        </> : <>
                            <i className="fa-solid fa-user-plus mr-2"></i>注册
                                                        </>}
                    </button>
                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => setShowRegister(false)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-sm">已有账号？返回登录
                                                        </button>
                    </div>
                </form>}
            </div>
        </div>
    );
};

export default Login;