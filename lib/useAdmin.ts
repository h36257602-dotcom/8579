"use client";
// 호환용 훅: 이제 "관리자 비밀번호" 대신 "로그인 여부" 를 의미합니다.
// 모든 페이지의 useAdmin() 호출은 그대로 두고, 내부 구현만 교체했습니다.
import { useUser } from "./useUser";

export function useAdmin(): boolean {
  const { user } = useUser();
  return !!user;
}
