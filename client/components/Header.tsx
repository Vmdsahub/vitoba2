import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NewSearchSystem from "@/components/NewSearchSystem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import AdvancedCaptcha from "@/components/AdvancedCaptcha";
import TermsDialog from "@/components/TermsDialog";
import { toast } from "sonner";

interface HeaderProps {
  activeSection?: "newsletter" | "forum";
}

export default function Header({ activeSection }: HeaderProps) {
  const { user, isLoading, isAdmin, login, register, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const {
    notifications,
    removeNotification,
    clearNotifications,
    markAllAsRead,
    unreadCount,
    addNotification,
  } = useNotifications();
  const notificationRef = useRef<HTMLDivElement>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginCaptcha, setLoginCaptcha] = useState("");
  const [loginCaptchaValid, setLoginCaptchaValid] = useState(false);

  // Register form state
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerBirthDay, setRegisterBirthDay] = useState("");
  const [registerBirthMonth, setRegisterBirthMonth] = useState("");
  const [registerBirthYear, setRegisterBirthYear] = useState("");
  const [registerAcceptTerms, setRegisterAcceptTerms] = useState(false);
  const [registerAcceptNewsletter, setRegisterAcceptNewsletter] =
    useState(false);
  const [registerCaptcha, setRegisterCaptcha] = useState("");
  const [registerCaptchaValid, setRegisterCaptchaValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: boolean;
  }>({});
  const [fieldMessages, setFieldMessages] = useState<{ [key: string]: string }>(
    {},
  );

  const handleAccountClick = () => {
    navigate("/account");
  };

  const handleSavedTopicsClick = () => {
    navigate("/saved-topics");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDeleteNotification = (notificationId: string) => {
    removeNotification(notificationId);
  };

  // Real-time validation functions
  const checkUsernameAvailable = async (username: string) => {
    if (!username || username.length < 2) return;

    try {
      const response = await fetch(
        `/api/auth/check-username/${encodeURIComponent(username)}`,
      );
      const data = await response.json();

      setValidationErrors((prev) => ({
        ...prev,
        username: !data.available,
      }));
      setFieldMessages((prev) => ({
        ...prev,
        username: data.message,
      }));
    } catch (error) {
      console.error("Error checking username:", error);
    }
  };

  const checkEmailAvailable = async (email: string) => {
    if (!email || !email.includes("@")) return;

    try {
      const response = await fetch(
        `/api/auth/check-email/${encodeURIComponent(email)}`,
      );
      const data = await response.json();

      setValidationErrors((prev) => ({
        ...prev,
        email: !data.available,
      }));
      setFieldMessages((prev) => ({
        ...prev,
        email: data.message,
      }));
    } catch (error) {
      console.error("Error checking email:", error);
    }
  };

  const checkPhoneAvailable = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) return;

    try {
      const response = await fetch(
        `/api/auth/check-phone/${encodeURIComponent(phone)}`,
      );
      const data = await response.json();

      setValidationErrors((prev) => ({
        ...prev,
        phone: !data.available,
      }));
      setFieldMessages((prev) => ({
        ...prev,
        phone: data.message,
      }));
    } catch (error) {
      console.error("Error checking phone:", error);
    }
  };

  const validatePassword = (password: string, confirmPassword: string) => {
    // Validação em tempo real da senha
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const isPasswordValid = hasMinLength && hasUppercase;
    const isPasswordInvalid = password.length > 0 && !isPasswordValid;

    const doPasswordsMatch =
      confirmPassword.length > 0 && password !== confirmPassword;

    setValidationErrors((prev) => ({
      ...prev,
      password: isPasswordInvalid,
      confirmPassword: doPasswordsMatch,
    }));

    let passwordMessage = "";
    if (password.length > 0 && !hasMinLength) {
      passwordMessage = "A senha deve ter pelo menos 8 caracteres";
    } else if (password.length >= 8 && !hasUppercase) {
      passwordMessage = "A senha deve conter pelo menos uma letra maiúscula";
    }

    setFieldMessages((prev) => ({
      ...prev,
      password: passwordMessage,
      confirmPassword: doPasswordsMatch ? "As senhas não coincidem" : "",
    }));
  };

  const validateBirthDate = (day: string, month: string, year: string) => {
    // Validação em tempo real da data de nascimento
    let isBirthDateInvalid = false;
    let birthDateMessage = "";

    // Se todos os campos estão preenchidos, validar
    if (day && month && year) {
      const birthDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
      );

      // Verificar se a data é válida
      if (
        birthDate.getDate() !== parseInt(day) ||
        birthDate.getMonth() !== parseInt(month) - 1 ||
        birthDate.getFullYear() !== parseInt(year)
      ) {
        isBirthDateInvalid = true;
        birthDateMessage = "Data inválida";
      } else {
        // Verificar se o usuário tem pelo menos 18 anos
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        // Ajustar idade se ainda não fez aniversário este ano
        const actualAge =
          age - (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? 1 : 0);

        if (actualAge < 18) {
          isBirthDateInvalid = true;
          birthDateMessage =
            "Você deve ter pelo menos 18 anos para se cadastrar";
        }
      }
    }

    setValidationErrors((prev) => ({
      ...prev,
      birthDate: isBirthDateInvalid,
    }));

    setFieldMessages((prev) => ({
      ...prev,
      birthDate: birthDateMessage,
    }));
  };

  return (
    <header className="fixed top-0 z-50 w-full glass-minimal border-b border-black/5 backdrop-blur-lg bg-white/95">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-6 mx-auto">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center hover:opacity-75 transition-opacity"
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F503e95fcc6af443aa8cd375cfa461af7%2F980512f033cd4818997e6218b806b298?format=webp&width=800"
              alt="IA HUB"
              className="h-14 w-auto"
            />
          </Link>
          {/* Gear button to open image editor - positioned next to logo */}
          <button
            onClick={() => navigate("/editor")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Editor de Imagem"
            aria-label="Editor de Imagem"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.31-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06c.46.46 1.12.6 1.82.33.6-.2 1-.81 1-1.51V3a2 2 0 1 1 4 0v.09c0 .7.4 1.31 1 1.51.7.27 1.36.13 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.46.46-.6 1.12-.33 1.82.2.6.81 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.7 0-1.31.4-1.51 1z"></path>
            </svg>
          </button>
        </div>

        {/* Search System and Saved Topics Container */}
        <div className="flex-1 flex items-center justify-center ml-16">
          <div className="flex items-center gap-2 max-w-[605px] w-full">
            <NewSearchSystem activeSection={activeSection} />
            {/* Saved Topics Button - Only show in forum */}
            {activeSection === "forum" && (
              <button
                onClick={handleSavedTopicsClick}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                title="Tópicos Salvos"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
                   <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                 </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <>
              {/* Shop Icon */}
              <button
                onClick={() => navigate("/shop")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Loja de Likes"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </button>

              {/* Notifications */}
              <div ref={notificationRef} className="relative">
                <button
                  onClick={() => {
                    const isOpening = !showNotifications;
                    setShowNotifications(isOpening);
                    if (isOpening && unreadCount > 0) {
                      markAllAsRead();
                    }
                  }}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Notificações"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-gray-600"
                  >
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">
                          Notificações
                        </h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={clearNotifications}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Limpar todas
                          </button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          Nenhuma notificação
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`flex items-start justify-between p-2 border rounded-lg hover:bg-gray-50 ${
                                notification.read
                                  ? "border-gray-100 bg-white"
                                  : "border-blue-200 bg-blue-50"
                              }`}
                            >
                              <div className="flex items-start gap-2 flex-1">
                                {notification.type === "badge" && (
                                  <div className="flex-shrink-0 w-8 h-8 mt-0.5">
                                    {notification.icon ? (
                                      <img
                                        src={notification.icon}
                                        alt="Emblema"
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <div className="text-yellow-500">���</div>
                                    )}
                                  </div>
                                )}
                                {notification.type === "quote" && (
                                  <div className="text-blue-500 mt-0.5">💬</div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-start gap-2">
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                    )}
                                    <div className="flex-1">
                                      <p
                                        className={`text-sm ${notification.read ? "text-gray-700" : "text-gray-900 font-medium"}`}
                                      >
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {notification.time}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleDeleteNotification(notification.id)
                                }
                                className="text-gray-400 hover:text-gray-600 p-1"
                                title="Excluir notificação"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-black/5 transition-colors duration-200">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold overflow-hidden">
                    {user.avatar &&
                    (user.avatar.startsWith("http") ||
                      user.avatar.startsWith("/")) ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    )}
                  </div>
                  <span className="font-medium text-black">{user.name}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="text-gray-400"
                  >
                    <path d="M4 6l4 4 4-4H4z" />
                  </svg>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2">
                    <button
                      onClick={handleAccountClick}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="text-gray-600"
                      >
                        <path d="M8 7c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 1c-1.5 0-4 .8-4 2.5V12h8v-1.5c0-1.7-2.5-2.5-4-2.5z" />
                      </svg>
                      <span className="text-gray-700">Central do Usuário</span>
                    </button>
                    <hr className="my-2" />
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-50 transition-colors text-left"
                      onClick={() => logout()}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="text-red-600"
                      >
                        <path d="M3 3h6v2H3v6h6v2H3c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm7 4l-1.4-1.4L10 4.2 13.8 8 10 11.8l-1.4-1.4L10 9H5V7h5z" />
                      </svg>
                      <span className="text-red-600">Sair</span>
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <>
              {/* Login Dialog */}
              <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-black/70 hover:text-black hover:bg-black/5 font-medium"
                  >
                    Login
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-white border border-gray-200 shadow-lg">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 text-xl font-semibold">
                      Fazer Login
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!loginCaptchaValid) {
                        toast.error(
                          "Por favor, complete a verificação de segurança",
                        );
                        return;
                      }

                      const success = await login(
                        loginEmail,
                        loginPassword,
                        loginCaptcha,
                      );
                      if (success) {
                        setIsLoginOpen(false);
                        setLoginEmail("");
                        setLoginPassword("");
                        setLoginCaptcha("");
                        setLoginCaptchaValid(false);
                      }
                    }}
                    className="space-y-4 py-4"
                  >
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-gray-900 font-medium"
                      >
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-gray-900 font-medium"
                      >
                        Senha
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 bg-white"
                        required
                        minLength={6}
                      />
                    </div>
                    <AdvancedCaptcha
                      onCaptchaChange={setLoginCaptcha}
                      onValidationChange={setLoginCaptchaValid}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-gray-900 text-white hover:bg-gray-800 font-medium"
                      disabled={isLoading || !loginCaptchaValid}
                    >
                      {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Register Dialog */}
              <Dialog
                open={isRegisterOpen}
                onOpenChange={(open) => {
                  setIsRegisterOpen(open);
                  if (!open) {
                    // Reset form when closing modal
                    setRegisterFirstName("");
                    setRegisterLastName("");
                    setRegisterUsername("");
                    setRegisterEmail("");
                    setRegisterPassword("");
                    setRegisterConfirmPassword("");
                    setRegisterPhone("");
                    setRegisterBirthDay("");
                    setRegisterBirthMonth("");
                    setRegisterBirthYear("");
                    setRegisterAcceptTerms(false);
                    setRegisterAcceptNewsletter(false);
                    setRegisterCaptcha("");
                    setRegisterCaptchaValid(false);
                    setValidationErrors({});
                    setFieldMessages({});
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-black text-white hover:bg-black/90 font-medium"
                  >
                    Cadastrar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto bg-white border border-gray-200 shadow-lg">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 text-xl font-semibold">
                      Criar Conta
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    noValidate
                    onSubmit={async (e) => {
                      e.preventDefault();

                      try {
                        if (isLoading) {
                          console.log(
                            "Already loading, preventing duplicate submission",
                          );
                          return;
                        }

                        // Reset validation errors but check availability again for current values
                        const errors: { [key: string]: boolean } = {};

                        // Re-check username availability if we have a username
                        if (registerUsername.trim()) {
                          const usernameResponse = await fetch(
                            `/api/auth/check-username/${encodeURIComponent(registerUsername)}`,
                          );
                          const usernameData = await usernameResponse.json();
                          if (!usernameData.available) {
                            errors.username = true;
                          }
                        }

                        // Re-check email availability if we have an email
                        if (
                          registerEmail.trim() &&
                          registerEmail.includes("@")
                        ) {
                          const emailResponse = await fetch(
                            `/api/auth/check-email/${encodeURIComponent(registerEmail)}`,
                          );
                          const emailData = await emailResponse.json();
                          if (!emailData.available) {
                            errors.email = true;
                          }
                        }

                        // Re-check phone availability if we have a phone
                        if (registerPhone.trim()) {
                          const phoneResponse = await fetch(
                            `/api/auth/check-phone/${encodeURIComponent(registerPhone)}`,
                          );
                          const phoneData = await phoneResponse.json();
                          if (!phoneData.available) {
                            errors.phone = true;
                          }
                        }

                        // Validações de campos obrigatórios
                        if (
                          !registerFirstName.trim() ||
                          registerFirstName.length < 2
                        ) {
                          errors.firstName = true;
                        }
                        if (
                          !registerLastName.trim() ||
                          registerLastName.length < 2
                        ) {
                          errors.lastName = true;
                        }
                        if (
                          !registerUsername.trim() ||
                          registerUsername.length < 2
                        ) {
                          errors.username = true;
                        }
                        if (
                          !registerEmail.trim() ||
                          !registerEmail.includes("@")
                        ) {
                          errors.email = true;
                        }
                        if (
                          !registerPassword ||
                          registerPassword.length < 8 ||
                          !/(?=.*[A-Z])/.test(registerPassword)
                        ) {
                          errors.password = true;
                        }
                        if (
                          !registerConfirmPassword ||
                          registerPassword !== registerConfirmPassword
                        ) {
                          errors.confirmPassword = true;
                        }
                        if (
                          !registerPhone.replace(/\D/g, "") ||
                          registerPhone.replace(/\D/g, "").length < 10
                        ) {
                          errors.phone = true;
                        }
                        if (
                          !registerBirthDay ||
                          !registerBirthMonth ||
                          !registerBirthYear
                        ) {
                          errors.birthDate = true;
                        }
                        if (!registerAcceptTerms) {
                          errors.terms = true;
                        }
                        if (!registerCaptchaValid) {
                          errors.captcha = true;
                        }

                        // Verificar se a data é válida
                        if (
                          registerBirthDay &&
                          registerBirthMonth &&
                          registerBirthYear
                        ) {
                          const birthDate = new Date(
                            parseInt(registerBirthYear),
                            parseInt(registerBirthMonth) - 1,
                            parseInt(registerBirthDay),
                          );
                          if (
                            birthDate.getDate() !==
                              parseInt(registerBirthDay) ||
                            birthDate.getMonth() !==
                              parseInt(registerBirthMonth) - 1 ||
                            birthDate.getFullYear() !==
                              parseInt(registerBirthYear)
                          ) {
                            errors.birthDate = true;
                          } else {
                            // Verificar se o usuário tem pelo menos 18 anos
                            const today = new Date();
                            const age =
                              today.getFullYear() - birthDate.getFullYear();
                            const monthDiff =
                              today.getMonth() - birthDate.getMonth();
                            const dayDiff =
                              today.getDate() - birthDate.getDate();

                            // Ajustar idade se ainda não fez aniversário este ano
                            const actualAge =
                              age -
                              (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)
                                ? 1
                                : 0);

                            if (actualAge < 18) {
                              errors.birthDate = true;
                              setFieldMessages((prev) => ({
                                ...prev,
                                birthDate:
                                  "Você deve ter pelo menos 18 anos para se cadastrar",
                              }));
                            } else {
                              setFieldMessages((prev) => {
                                const { birthDate, ...rest } = prev;
                                return rest;
                              });
                            }
                          }
                        }

                        // Se há erros (exceto captcha), mostrar e parar
                        const nonCaptchaErrors = Object.keys(errors).filter(
                          (key) => key !== "captcha",
                        );

                        console.log("[FORM VALIDATION]", {
                          errors,
                          nonCaptchaErrors,
                          formData: {
                            firstName: registerFirstName,
                            lastName: registerLastName,
                            username: registerUsername,
                            email: registerEmail,
                            password: registerPassword,
                            confirmPassword: registerConfirmPassword,
                            phone: registerPhone,
                            birthDay: registerBirthDay,
                            birthMonth: registerBirthMonth,
                            birthYear: registerBirthYear,
                            captchaValid: registerCaptchaValid,
                          },
                        });

                        if (nonCaptchaErrors.length > 0) {
                          setValidationErrors(errors);
                          toast.error(
                            "Por favor, preencha todos os campos corretamente",
                          );
                          return;
                        }

                        // Se apenas erro de captcha, permitir prosseguir mas mostrar erro específico
                        if (errors.captcha) {
                          setValidationErrors(errors);
                          toast.error(
                            "Por favor, complete a verificação de seguran��a",
                          );
                          return;
                        }

                        const fullName = registerUsername.trim();
                        const formattedBirthDate = `${registerBirthYear}-${registerBirthMonth.padStart(2, "0")}-${registerBirthDay.padStart(2, "0")}`;

                        console.log("Submitting registration form...", {
                          fullName,
                          registerEmail,
                          registerPhone,
                          formattedBirthDate,
                        });

                        console.log("[FORM] Calling register function");

                        const success = await register(
                          fullName,
                          registerEmail,
                          registerPassword,
                          registerPhone,
                          formattedBirthDate,
                          registerAcceptTerms,
                          registerAcceptNewsletter,
                          registerCaptcha,
                        );

                        console.log(
                          "[FORM] Register completed, success:",
                          success,
                        );

                        if (success) {
                          setIsRegisterOpen(false);
                          setRegisterFirstName("");
                          setRegisterLastName("");
                          setRegisterUsername("");
                          setRegisterEmail("");
                          setRegisterPassword("");
                          setRegisterConfirmPassword("");
                          setRegisterPhone("");
                          setRegisterBirthDay("");
                          setRegisterBirthMonth("");
                          setRegisterBirthYear("");
                          setRegisterAcceptTerms(false);
                          setRegisterAcceptNewsletter(false);
                          setRegisterCaptcha("");
                          setRegisterCaptchaValid(false);
                          setValidationErrors({});
                          setFieldMessages({});
                        }
                      } catch (formError) {
                        console.error(
                          "[REGISTER FORM] Form submission error:",
                          formError,
                        );
                        setTimeout(() => {
                          toast.error("Erro no formulário. Tente novamente.");
                        }, 0);
                      }
                    }}
                    className="space-y-4 py-4"
                  >
                    {/* Nome e Sobrenome */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          id="first-name"
                          placeholder="Nome"
                          value={registerFirstName}
                          onChange={(e) => setRegisterFirstName(e.target.value)}
                          className={`focus:border-gray-500 focus:ring-gray-500 bg-white h-11 text-sm ${
                            validationErrors.firstName
                              ? "border-red-500 text-red-600"
                              : "border-gray-300"
                          }`}
                          required
                          minLength={2}
                        />
                      </div>
                      <div>
                        <Input
                          id="last-name"
                          placeholder="Sobrenome"
                          value={registerLastName}
                          onChange={(e) => setRegisterLastName(e.target.value)}
                          className={`focus:border-gray-500 focus:ring-gray-500 bg-white h-11 text-sm ${
                            validationErrors.lastName
                              ? "border-red-500 text-red-600"
                              : "border-gray-300"
                          }`}
                          required
                          minLength={2}
                        />
                      </div>
                    </div>

                    {/* Nome de usuário */}
                    <div>
                      <Input
                        id="username"
                        placeholder="Nome de usuário"
                        value={registerUsername}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRegisterUsername(value);
                          if (value.length >= 2) {
                            const timeoutId = setTimeout(
                              () => checkUsernameAvailable(value),
                              500,
                            );
                            return () => clearTimeout(timeoutId);
                          }
                        }}
                        className={`focus:border-gray-500 focus:ring-gray-500 bg-white h-11 text-sm ${
                          validationErrors.username
                            ? "border-red-500 text-red-600"
                            : "border-gray-300"
                        }`}
                        required
                        minLength={2}
                      />
                      {fieldMessages.username &&
                        registerUsername.trim() &&
                        validationErrors.username && (
                          <p className="text-xs mt-2 text-red-600">
                            {fieldMessages.username}
                          </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Email"
                        value={registerEmail}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRegisterEmail(value);
                          if (value.includes("@")) {
                            const timeoutId = setTimeout(
                              () => checkEmailAvailable(value),
                              500,
                            );
                            return () => clearTimeout(timeoutId);
                          }
                        }}
                        className={`focus:border-gray-500 focus:ring-gray-500 bg-white h-11 text-sm ${
                          validationErrors.email
                            ? "border-red-500 text-red-600"
                            : "border-gray-300"
                        }`}
                        required
                      />
                      {fieldMessages.email &&
                        registerEmail.trim() &&
                        validationErrors.email && (
                          <p className="text-xs mt-2 text-red-600">
                            {fieldMessages.email}
                          </p>
                        )}
                    </div>

                    {/* Senhas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Senha"
                          value={registerPassword}
                          onChange={(e) => {
                            const value = e.target.value;
                            setRegisterPassword(value);
                            validatePassword(value, registerConfirmPassword);
                          }}
                          className={`focus:border-gray-500 focus:ring-gray-500 bg-white h-11 text-sm ${
                            validationErrors.password
                              ? "border-red-500 text-red-600"
                              : "border-gray-300"
                          }`}
                          required
                          minLength={8}
                          pattern="(?=.*[A-Z]).*"
                        />
                        {registerPassword.trim() &&
                          validationErrors.password && (
                            <p className="text-xs mt-2 text-red-600">
                              {fieldMessages.password}
                            </p>
                          )}
                      </div>
                      <div>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirmar Senha"
                          value={registerConfirmPassword}
                          onChange={(e) => {
                            const value = e.target.value;
                            setRegisterConfirmPassword(value);
                            validatePassword(registerPassword, value);
                          }}
                          className={`focus:border-gray-500 focus:ring-gray-500 bg-white h-11 text-sm ${
                            validationErrors.confirmPassword
                              ? "border-red-500 text-red-600"
                              : "border-gray-300"
                          }`}
                          required
                          minLength={8}
                        />
                        {registerConfirmPassword.trim() &&
                          validationErrors.confirmPassword && (
                            <p className="text-xs mt-2 text-red-600">
                              {fieldMessages.confirmPassword}
                            </p>
                          )}
                      </div>
                    </div>

                    <div>
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={registerPhone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 11) {
                            let formatted = value;
                            if (value.length > 2) {
                              formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                            }
                            if (value.length > 7) {
                              formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
                            }
                            setRegisterPhone(formatted);

                            if (value.length >= 10) {
                              const timeoutId = setTimeout(
                                () => checkPhoneAvailable(formatted),
                                500,
                              );
                              return () => clearTimeout(timeoutId);
                            }
                          }
                        }}
                        className={`focus:border-gray-500 focus:ring-gray-500 bg-white h-9 ${
                          validationErrors.phone
                            ? "border-red-500 text-red-600"
                            : "border-gray-300"
                        }`}
                        required
                        maxLength={15}
                      />
                      {fieldMessages.phone &&
                        registerPhone.trim() &&
                        validationErrors.phone && (
                          <p className="text-xs mt-1 text-red-600">
                            {fieldMessages.phone}
                          </p>
                        )}
                    </div>

                    {/* Data de Nascimento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Data de Nascimento
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <select
                          id="birth-day"
                          value={registerBirthDay}
                          onChange={(e) => {
                            const value = e.target.value;
                            setRegisterBirthDay(value);
                            validateBirthDate(
                              value,
                              registerBirthMonth,
                              registerBirthYear,
                            );
                          }}
                          className={`w-full h-11 px-3 border rounded-md bg-white text-sm focus:border-gray-500 focus:ring-gray-500 ${
                            validationErrors.birthDate
                              ? "border-red-500 text-red-600"
                              : "border-gray-300"
                          }`}
                          required
                        >
                          <option value="">Dia</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(
                            (day) => (
                              <option
                                key={day}
                                value={day.toString().padStart(2, "0")}
                              >
                                {day}
                              </option>
                            ),
                          )}
                        </select>
                        <select
                          id="birth-month"
                          value={registerBirthMonth}
                          onChange={(e) => {
                            const value = e.target.value;
                            setRegisterBirthMonth(value);
                            validateBirthDate(
                              registerBirthDay,
                              value,
                              registerBirthYear,
                            );
                          }}
                          className={`w-full h-11 px-3 border rounded-md bg-white text-sm focus:border-gray-500 focus:ring-gray-500 ${
                            validationErrors.birthDate
                              ? "border-red-500 text-red-600"
                              : "border-gray-300"
                          }`}
                          required
                        >
                          <option value="">Mês</option>
                          <option value="01">Janeiro</option>
                          <option value="02">Fevereiro</option>
                          <option value="03">Março</option>
                          <option value="04">Abril</option>
                          <option value="05">Maio</option>
                          <option value="06">Junho</option>
                          <option value="07">Julho</option>
                          <option value="08">Agosto</option>
                          <option value="09">Setembro</option>
                          <option value="10">Outubro</option>
                          <option value="11">Novembro</option>
                          <option value="12">Dezembro</option>
                        </select>
                        <select
                          id="birth-year"
                          value={registerBirthYear}
                          onChange={(e) => {
                            const value = e.target.value;
                            setRegisterBirthYear(value);
                            validateBirthDate(
                              registerBirthDay,
                              registerBirthMonth,
                              value,
                            );
                          }}
                          className={`w-full h-11 px-3 border rounded-md bg-white text-sm focus:border-gray-500 focus:ring-gray-500 ${
                            validationErrors.birthDate
                              ? "border-red-500 text-red-600"
                              : "border-gray-300"
                          }`}
                          required
                        >
                          <option value="">Ano</option>
                          {Array.from(
                            { length: 100 },
                            (_, i) => new Date().getFullYear() - i,
                          ).map((year) => (
                            <option key={year} value={year.toString()}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      {fieldMessages.birthDate &&
                        validationErrors.birthDate && (
                          <p className="text-xs mt-1 text-red-600">
                            {fieldMessages.birthDate}
                          </p>
                        )}
                    </div>

                    {/* Termos e Newsletter */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="register-terms"
                          checked={registerAcceptTerms}
                          onCheckedChange={(checked) =>
                            setRegisterAcceptTerms(checked as boolean)
                          }
                        />
                        <label
                          htmlFor="register-terms"
                          className={`text-sm ${
                            validationErrors.terms
                              ? "text-red-600"
                              : "text-gray-700"
                          }`}
                        >
                          Aceito os{" "}
                          <TermsDialog>
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              termos e condições
                            </button>
                          </TermsDialog>
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="register-newsletter"
                          checked={registerAcceptNewsletter}
                          onCheckedChange={(checked) =>
                            setRegisterAcceptNewsletter(checked as boolean)
                          }
                        />
                        <label
                          htmlFor="register-newsletter"
                          className="text-sm text-gray-700"
                        >
                          Quero receber newsletter
                        </label>
                      </div>
                    </div>

                    <div
                      className={
                        validationErrors.captcha
                          ? "border border-red-500 rounded-md p-2"
                          : ""
                      }
                    >
                      <AdvancedCaptcha
                        onCaptchaChange={setRegisterCaptcha}
                        onValidationChange={setRegisterCaptchaValid}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gray-900 text-white hover:bg-gray-800 font-medium h-12 text-base mt-6 transition-colors duration-200"
                      disabled={isLoading || !registerAcceptTerms}
                    >
                      {isLoading ? "Criando conta..." : "Criar Conta"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </header>
  );
}