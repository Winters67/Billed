/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

/* Le premier test ("fetches bills from mock API GET") vérifie que les données des notes de frais 
sont correctement récupérées depuis l'API (ici simulée par un mock). 
Il teste si les données récupérées correspondent à celles du fichier de test "bills.js".
 Il vérifie également que le nombre de notes de frais en attente et refusées
  s'affichent correctement sur la page.*/

jest.mock("../app/store", () => mockStore);

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "a@a",
    })
  );
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "admin", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Dashboard);
      await waitFor(() => screen.getByText("Validations"));
      const contentPending = await screen.getByText("En attente (1)");
      expect(contentPending).toBeTruthy();
      const contentRefused = await screen.getByText("Refusé (2)");
      expect(contentRefused).toBeTruthy();
      expect(screen.getByTestId("big-billed-icon")).toBeTruthy();
    });

    /*Le deuxième test ("Then bill icon in vertical layout should be highlighted") 
    vérifie que l'icône "Notes de frais" dans le menu latéral est bien mise en 
    surbrillance lorsque l'utilisateur est sur la page des notes de frais.*/

    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));

      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    /*Le troisième test ("Then bills should be ordered from earliest to latest")
 vérifie que les notes de frais sont triées de la plus ancienne à la plus récente. */
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a > b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
});

/*Le quatrième test ("Then a modal should open") 
vérifie que la modale s'ouvre correctement lorsqu'on
 clique sur l'icône "voir" d'une note de frais.*/
describe("When I am on Bills Page and I click on icon eye", () => {
  test("Then a modal should open", () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    document.body.innerHTML = BillsUI({ data: bills });

    const allBills = new Bills({
      document,
      onNavigate,
      store: null,
      bills: bills,
      localStorage: window.localStorage,
    });

    // Mock - jquery function modal()
    $.fn.modal = jest.fn();

    const firstIconEye = screen.getAllByTestId("icon-eye")[0];
    const handleClickIconEye = jest.fn(() =>
      allBills.handleClickIconEye(firstIconEye)
    );

    firstIconEye.addEventListener("click", handleClickIconEye);
    userEvent.click(firstIconEye);

    expect(handleClickIconEye).toHaveBeenCalled();

    const modal = screen.getByTestId("modaleFile");
    expect(modal).toBeTruthy();
  });
});

/*Le cinquième test ("Then I should be send on the new bill page form") 
vérifie que l'utilisateur est redirigé vers le formulaire
 de création d'une nouvelle note de frais lorsqu'il clique sur le bouton 
 "Nouvelle note de frais".*/
describe("When I am on Bills Page and I click on the new bill button", () => {
  test("Then I should be send on the new bill page form", () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    document.body.innerHTML = BillsUI({ data: bills });

    const allBills = new Bills({
      document,
      onNavigate,
      store: null,
      localStorageMock,
    });

    const handleClickNewBill = jest.fn(() => allBills.handleClickNewBill());

    const btnNewBill = screen.getByTestId("btn-new-bill");
    btnNewBill.addEventListener("click", handleClickNewBill);
    userEvent.click(btnNewBill);
    expect(handleClickNewBill).toHaveBeenCalled();

    const formNewBill = screen.getByTestId("form-new-bill");
    expect(formNewBill).toBeTruthy();
  });
});

/*Le sixième test ("Then fetches bills from mock API GET") 
est un test d'intégration qui vérifie
 que les données des notes de frais sont bien récupérées depuis l'API
  (ici aussi simulée par un mock).
   Il vérifie également que les données récupérées sont correctement
    affichées sur la page des notes de frais.*/

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    test("Then fetches bills from mock API GET", async () => {
      const storeMethodeSpy = jest.spyOn(mockStore, "bills");

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const headerTitle = screen.getByText("Mes notes de frais");
      expect(headerTitle).toBeTruthy();

      expect(storeMethodeSpy).toHaveBeenCalled();

      const allBillsUI = screen.getAllByTestId("bill-list-item");
      expect(allBillsUI.length).toEqual(4);
    });
  });

  describe("When I navigate to Bills Page and an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
  });
});
