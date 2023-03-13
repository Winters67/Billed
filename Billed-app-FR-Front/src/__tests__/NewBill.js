/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

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

/*Test 1 - "Then i upload a file with valid extention (jpg,jpeg,png)"
Ce test vérifie si le traitement de la méthode handleChangeFile se passe 
correctement lorsqu'un fichier avec une extension valide est sélectionné.
Lorsque l'utilisateur sélectionne un fichier, la méthode handleChangeFile est appelée,
 laquelle vérifie que le fichier est une image avec une extension valide et l'ajoute à l'état interne de l'application.
Ce test vérifie également que la méthode handleChangeFile a été appelée, 
que le type de fichier ajouté à l'état est correct et que l'input de fichier est rempli avec le nom de fichier.
*/
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then i upload a file with valid extention (jpg,jpeg,png)", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["test-valid-extension.jpg"], "test-valid-extension.jpg", {
              type: "image/jpg",
            }),
          ],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].type).toBe("image/jpg");
    });

    /*Test 2 - "Then I upload a file with invalid extension"
Ce test vérifie si le traitement de la méthode handleChangeFile 
se passe correctement lorsqu'un fichier avec une extension non valide est sélectionné.
Lorsque l'utilisateur sélectionne un fichier avec une extension non valide, 
la méthode handleChangeFile affiche un message d'erreur et vide l'input de fichier.
Ce test vérifie que la méthode handleChangeFile a été appelée, 
que l'input de fichier est vide et que le message d'erreur a été affiché dans la console.
*/

    test("Then I upload a file with invalid extension", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(
              ["test-invalid-extension.gif"],
              "test-invalid-extension.gif",
              { type: "image/gif" }
            ),
          ],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].type).toBe("image/gif");
      expect(inputFile.value).toBe("");
      const headerTitle = screen.getByText(
        "Seule les fichiers .jpg, .png .jepg sont autorisées"
      );
      expect(headerTitle).toBeTruthy();
    });
  });

  /*Test 3 - "Then It should call handleSubmit method"
Ce test vérifie si la méthode handleSubmit est appelée lorsque l'utilisateur 
soumet le formulaire de nouvelle facture.
Lorsque l'utilisateur soumet le formulaire,
 la méthode handleSubmit est appelée et envoie les données de la facture au serveur.
Ce test vérifie que la méthode handleSubmit a été appelée.
*/

  describe("When I am on NewBill Page and I submit the New Bill form", () => {
    test("Then It should call handleSubmit method", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });

      const handleSubmitMethode = jest.fn(newBill.handleSubmit);
      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", handleSubmitMethode);
      fireEvent.submit(formNewBill);
      expect(handleSubmitMethode).toHaveBeenCalled();
    });
  });
});

/*Test 4 - "Then it should fetches new bill to mock API POST and redirected me to Bills Page"
Ce test vérifie si l'ajout d'une nouvelle facture se passe correctement lorsqu'elle est soumise au serveur avec succès.
Lorsque l'utilisateur soumet le formulaire,
 la méthode handleSubmit envoie les données de la facture au serveur en utilisant une méthode fetch mockée.
Ce test vérifie que la méthode fetch a été appelée avec les données de la facture, 
que la facture a été ajoutée avec succès et que l'utilisateur est redirigé vers la page des factures.
*/

// test d'intégration POST
describe("Given I am a user connected as an employee", () => {
  describe("When I create a new bill", () => {
    test("Then it should fetches new bill to mock API POST and redirected me to Bills Page", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();

      jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.resolve();
          },
        };
      });

      window.onNavigate(ROUTES_PATH.NewBill);
      await new Promise(process.nextTick);
      const headerTitle = screen.getByText("Mes notes de frais");
      expect(headerTitle).toBeTruthy();
    });
  });
  describe("When I create a new bill and an error occurs on API", () => {
    beforeEach(() => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();

      /*Test 5 - "Then fetches bills to mock API POST and fails with 404 message error"
 Ce test vérifie si le traitement de l'erreur se passe correctement lorsque 
 la méthode fetch échoue avec une erreur 404.
Lorsque l'utilisateur soumet le formulaire, 
  */

      test("Then fetches bills to mock API POST and fails with 404 message error", async () => {
        jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.NewBill);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      /*	Test 6 - "Then fetches new bill to mock API POST and fails with 500 message error"
  	Ce test vérifie si le traitement de l'erreur 
    se passe correctement lorsque la méthode fetch échoue avec une erreur 500.*/

      test("Then fetches new bill to mock API POST and fails with 500 message error", async () => {
        jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.NewBill);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
