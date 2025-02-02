import { useDispatch, useSelector } from "react-redux";
import { HomeLayout } from "./HomeLayout";
import { useEffect } from "react";
import { fetchFolderElements } from "../../redux/reduxActions/folderActions";
import { getCurrentUser } from "../../redux/selectors/usersSelectors";
import { folderElementsSelector } from "../../redux/selectors/folderSelector";

export function HomeView() {
  const dispatch = useDispatch();

  const elements = useSelector(folderElementsSelector)[""];
  const user = useSelector(getCurrentUser);

  useEffect(() => {
    dispatch(fetchFolderElements({}));
  }, []);

  if (!user.currentOrgId) {
    return null;
  }

  return <HomeLayout elements={elements} mode={"view"} />;
}
